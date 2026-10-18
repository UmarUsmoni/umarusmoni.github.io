from __future__ import annotations

from dataclasses import dataclass
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from typing import Iterator

import pytest
from playwright.sync_api import Browser, Page, sync_playwright
from playwright.sync_api import Error as PlaywrightError


ROOT = Path(__file__).resolve().parents[1]


class QuietRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return


@dataclass
class SitePage:
    page: Page
    external_requests: list[str]
    console_errors: list[str]
    page_errors: list[str]


@pytest.fixture(scope="session")
def base_url() -> Iterator[str]:
    handler = partial(QuietRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        host, port = server.server_address
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


@pytest.fixture(scope="session")
def browser() -> Iterator[Browser]:
    with sync_playwright() as playwright:
        try:
            instance = playwright.chromium.launch(headless=True)
        except PlaywrightError as exc:
            pytest.skip(
                "Chromium is not installed; run "
                "python -m playwright install chromium before browser QA: "
                f"{exc}"
            )

        try:
            yield instance
        finally:
            instance.close()


@pytest.fixture
def site_page(browser: Browser, base_url: str) -> Iterator[SitePage]:
    external_requests: list[str] = []
    console_errors: list[str] = []
    page_errors: list[str] = []
    context = browser.new_context(
        viewport={"width": 1440, "height": 1000},
        service_workers="block",
    )

    def allow_local_or_record(route) -> None:
        url = route.request.url
        if url.startswith(base_url) or url.startswith("data:") or url.startswith("blob:"):
            route.continue_()
            return
        external_requests.append(url)
        route.abort()

    context.route("**/*", allow_local_or_record)
    page = context.new_page()
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.goto(f"{base_url}/index.html", wait_until="domcontentloaded")

    try:
        yield SitePage(page, external_requests, console_errors, page_errors)
    finally:
        page.close()
        context.close()
