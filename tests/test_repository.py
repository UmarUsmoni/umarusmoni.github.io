from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEXT_EXTENSIONS = {".css", ".html", ".js", ".md", ".mjs", ".py", ".txt", ".yml", ".yaml"}
SKIP_PARTS = {".git", ".omo", ".opencode", ".omnirush", ".od-skills", ".supergoal", ".pytest_cache", ".venv", "__pycache__"}


def text_files() -> list[Path]:
    return [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.suffix.lower() in TEXT_EXTENSIONS
        and not SKIP_PARTS.intersection(path.parts)
    ]


def test_reproducibility_files_exist() -> None:
    required = (
        ".python-version",
        "requirements.lock",
        "Dockerfile",
        "Makefile",
        ".dockerignore",
        "DESIGN.md",
    )
    assert all((ROOT / path).is_file() for path in required)


def test_runtime_and_dependencies_are_pinned() -> None:
    assert (ROOT / ".python-version").read_text(encoding="utf-8").strip() == "3.13.14"
    lines = [line.strip() for line in (ROOT / "requirements.lock").read_text(encoding="utf-8").splitlines() if line.strip()]
    assert lines
    assert all("==" in line and not any(operator in line for operator in (">", "<", "~")) for line in lines)


def test_makefile_exposes_one_canonical_test_command() -> None:
    makefile = (ROOT / "Makefile").read_text(encoding="utf-8")
    assert re.search(r"^test:\s*$", makefile, re.MULTILINE)
    assert "python -m pytest -q" in makefile


def test_container_uses_the_pinned_runtime() -> None:
    dockerfile = (ROOT / "Dockerfile").read_text(encoding="utf-8")
    assert "python:3.13.14-slim-bookworm" in dockerfile
    assert "playwright install --with-deps chromium" in dockerfile
    assert 'EXPOSE 8000' in dockerfile


def test_local_runtime_artifacts_are_ignored() -> None:
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    dockerignore = (ROOT / ".dockerignore").read_text(encoding="utf-8")
    for entry in ("/.omo/", "/.opencode/", ".pytest_cache/", ".venv/", ".env"):
        assert entry in gitignore
    for entry in (".omo", ".opencode", ".pytest_cache", ".env"):
        assert entry in dockerignore


def test_source_has_no_machine_paths_or_secret_files() -> None:
    source = "\n".join(path.read_text(encoding="utf-8") for path in text_files())
    assert "D:\\mysite" not in source
    assert "C:\\Users\\" not in source
    assert not (ROOT / ".env").exists()
    assert not (ROOT / ".env.local").exists()


def test_local_asset_references_exist() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    references = re.findall(r"(?:src|href)=\"(assets/[^\"?#]+)", html)
    missing = [reference for reference in references if not (ROOT / reference).is_file()]
    assert missing == []


def test_design_contract_bans_fake_security_positioning() -> None:
    design = (ROOT / "DESIGN.md").read_text(encoding="utf-8").lower()
    assert "prohibited claims" in design
    assert "fake command terminal" in design
    assert "museum portal" in design


def test_readme_describes_the_real_project_url_and_commands() -> None:
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "https://umarusmomi.github.io/umarusmoni.github.io/" in readme
    assert "make test" in readme
    assert "make serve" in readme
    assert "docker build" in readme
