from __future__ import annotations

import pytest

from conftest import SitePage


def test_semantic_shell_and_frontend_positioning(site_page: SitePage) -> None:
    page = site_page.page
    assert page.locator("header").count() == 1
    assert page.locator("main#main-content").count() == 1
    assert page.locator("footer").count() == 1
    assert page.locator("h1").count() == 1
    assert "Junior Frontend" in page.title()
    assert page.locator("h1").inner_text().strip()


def test_museum_case_study_is_the_featured_proof(site_page: SitePage) -> None:
    page = site_page.page
    body = page.locator("body").inner_text()
    assert page.locator('a[href="https://khujand-museum.com"]').count() >= 1
    assert "28,000+" in body
    assert "12 halls" in body
    assert "RU / TJ / EN" in body or "RU/TJ/EN" in body
    assert "5 halls" in body
    assert "90+" in body


def test_metadata_is_project_pages_safe(site_page: SitePage) -> None:
    page = site_page.page
    project_url = "https://umarusmomi.github.io/umarusmoni.github.io/"
    assert page.locator('link[rel="canonical"]').get_attribute("href") == project_url
    assert page.locator('meta[property="og:url"]').get_attribute("content") == project_url
    assert page.locator('meta[property="og:image"]').get_attribute("content")
    assert page.locator('meta[name="description"]').get_attribute("content")
    json_ld = page.locator('script[type="application/ld+json"]').all_text_contents()
    assert json_ld
    assert any("Junior Frontend" in item for item in json_ld)


def test_internal_anchors_resolve(site_page: SitePage) -> None:
    page = site_page.page
    missing = page.locator('a[href^="#"]').evaluate_all(
        "links => links.map(link => link.getAttribute('href')).filter(href => href !== '#' && !document.querySelector(href))"
    )
    assert missing == []


def test_new_tab_links_are_safe(site_page: SitePage) -> None:
    page = site_page.page
    links = page.locator('a[target="_blank"]')
    for index in range(links.count()):
        rel = links.nth(index).get_attribute("rel") or ""
        assert "noopener" in rel
        assert "noreferrer" in rel


def test_contact_paths_are_direct(site_page: SitePage) -> None:
    page = site_page.page
    assert page.locator('a[href^="mailto:"]').count() == 1
    assert page.locator('a[href="https://t.me/cloudety"]').count() == 1
    assert page.locator('a[href^="https://www.linkedin.com/"]').count() == 1
    assert page.locator("form").count() == 0


def test_images_have_alt_text_and_dimensions(site_page: SitePage) -> None:
    page = site_page.page
    invalid = page.locator("img").evaluate_all(
        "images => images.filter(image => !image.alt.trim() || !image.getAttribute('width') || !image.getAttribute('height')).map(image => image.outerHTML)"
    )
    assert invalid == []


def test_mobile_menu_keyboard_flow(site_page: SitePage) -> None:
    page = site_page.page
    page.set_viewport_size({"width": 390, "height": 844})
    toggle = page.locator("#menu-toggle")
    menu = page.locator("#mobile-menu")
    toggle.click()
    assert toggle.get_attribute("aria-expanded") == "true"
    assert menu.is_visible()
    page.keyboard.press("Escape")
    assert toggle.get_attribute("aria-expanded") == "false"
    assert page.evaluate("document.activeElement && document.activeElement.id") == "menu-toggle"


def test_certificate_dialog_keyboard_flow(site_page: SitePage) -> None:
    page = site_page.page
    trigger = page.locator("[data-certificate-trigger]").first
    dialog = page.locator("dialog").first
    trigger.click()
    assert dialog.is_visible()
    assert dialog.get_attribute("aria-modal") == "true"
    page.keyboard.press("Escape")
    assert not dialog.is_visible()


@pytest.mark.parametrize("width", [390, 768, 1024, 1440])
def test_no_horizontal_overflow(site_page: SitePage, width: int) -> None:
    page = site_page.page
    page.set_viewport_size({"width": width, "height": 900})
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")


def test_no_external_runtime_requests_or_errors(site_page: SitePage) -> None:
    page = site_page.page
    page.wait_for_timeout(250)
    assert site_page.external_requests == []
    assert site_page.console_errors == []
    assert site_page.page_errors == []


def test_fake_security_claims_are_absent(site_page: SitePage) -> None:
    body = site_page.page.locator("body").inner_text().lower()
    banned = (
        "cybersecurity student",
        "future pentester",
        "vibe coder",
        "cyberrecon",
        "audit verified",
        "0 vulnerabilities",
        "99.99%",
        "port scan",
        "tls 1.3",
        "system secure",
        "fake telemetry",
    )
    assert [phrase for phrase in banned if phrase in body] == []
