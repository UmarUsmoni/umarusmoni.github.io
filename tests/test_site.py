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
    assert page.locator('a[href="mailto:zunur007@gmail.com"]').count() >= 1
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


@pytest.mark.parametrize("width", [390, 768, 1024, 1440, 1920])
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


def test_hero_3d_canvas_and_controls(site_page: SitePage) -> None:
    page = site_page.page
    canvas = page.locator("#hero-3d-canvas")
    assert canvas.count() == 1
    wireframe_btn = page.locator("#hud-btn-wireframe")
    scan_btn = page.locator("#hud-btn-scan")
    reset_btn = page.locator("#hud-btn-reset")
    assert wireframe_btn.count() == 1
    assert scan_btn.count() == 1
    assert reset_btn.count() == 1

    wireframe_btn.click()
    assert "active" in (wireframe_btn.get_attribute("class") or "")
    wireframe_btn.click()
    assert "active" not in (wireframe_btn.get_attribute("class") or "")


def test_hero_fits_desktop_viewport_and_names_author(site_page: SitePage) -> None:
    page = site_page.page
    page.set_viewport_size({"width": 1440, "height": 960})
    hero_text = page.locator("#hero").inner_text().lower()
    assert "umar usmoni" in hero_text

    buttons = page.locator(".hero-actions .button")
    assert buttons.count() >= 2
    for idx in range(buttons.count()):
        box = buttons.nth(idx).bounding_box()
        assert box is not None
        assert box["y"] + box["height"] <= 940


def test_theme_toggle_and_44px_interactive_targets(site_page: SitePage) -> None:
    page = site_page.page
    theme_toggle = page.locator("#theme-toggle")
    assert theme_toggle.count() == 1

    for selector in ("#theme-toggle", "#hud-btn-wireframe", "#hud-btn-scan", "#hud-btn-reset"):
        box = page.locator(selector).bounding_box()
        assert box is not None
        assert box["height"] >= 44, f"{selector} height {box['height']} < 44px"

    theme_toggle.click()
    first_theme = page.evaluate("document.documentElement.dataset.theme")
    assert first_theme in ("light", "dark")
    if first_theme == "dark":
        theme_toggle.click()
    assert page.evaluate("document.documentElement.dataset.theme") == "light"

    contrast_ratio = page.locator("#hud-btn-wireframe").evaluate(
        """el => {
            const parse = (rgb) => rgb.match(/[\\d.]+/g).slice(0, 3).map(Number);
            const lum = ([r, g, b]) => {
                const f = (c) => {
                    const s = c / 255;
                    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
                };
                return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
            };
            const style = getComputedStyle(el);
            const l1 = lum(parse(style.color));
            const l2 = lum(parse(style.backgroundColor));
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        }"""
    )
    assert contrast_ratio >= 4.5, f"Light-mode HUD button contrast too low: {contrast_ratio:.2f}"


def test_interactive_museum_hall_preview(site_page: SitePage) -> None:
    page = site_page.page
    triggers = page.locator("[data-hall-trigger]")
    assert triggers.count() == 3
    for idx in range(triggers.count()):
        box = triggers.nth(idx).bounding_box()
        assert box is not None
        assert box["height"] >= 44

    initial_title = page.locator("#museum-hall-title").inner_text()
    assert "is-active" in (page.locator('[data-route-stop="01"]').get_attribute("class") or "")
    second = triggers.nth(1)
    second.click()
    assert second.get_attribute("aria-pressed") == "true"
    assert triggers.nth(0).get_attribute("aria-pressed") == "false"
    assert page.locator("#museum-hall-title").inner_text() != initial_title
    assert "is-active" in (page.locator('[data-route-stop="05"]').get_attribute("class") or "")
    assert "is-active" not in (page.locator('[data-route-stop="01"]').get_attribute("class") or "")


def test_mobile_header_single_line_typography(site_page: SitePage) -> None:
    page = site_page.page
    page.set_viewport_size({"width": 390, "height": 844})
    line_count_js = """el => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const tops = Array.from(range.getClientRects())
            .filter(r => r.width > 1 && r.height > 1)
            .map(r => Math.round(r.top / 4));
        return new Set(tops).size;
    }"""
    assert page.locator(".brand-name").evaluate(line_count_js) == 1
    assert page.locator(".site-header .nav-cta").evaluate(line_count_js) == 1


def test_certificate_dialog_carousel_and_verification_link(site_page: SitePage) -> None:
    page = site_page.page
    page.locator("[data-certificate-trigger]").first.click()
    dialog = page.locator("#certificate-dialog")
    assert dialog.is_visible()

    verify_link = page.locator("#certificate-dialog-verify")
    href = verify_link.get_attribute("href") or ""
    rel = verify_link.get_attribute("rel") or ""
    assert href.startswith("https://learn.deeplearning.ai/certificates/")
    assert "noopener" in rel and "noreferrer" in rel

    first_caption = page.locator("#certificate-dialog-caption").inner_text()
    page.locator("#certificate-dialog-next").click()
    second_caption = page.locator("#certificate-dialog-caption").inner_text()
    assert second_caption != first_caption

    page.keyboard.press("ArrowLeft")
    assert page.locator("#certificate-dialog-caption").inner_text() == first_caption
    page.keyboard.press("Escape")
    assert not dialog.is_visible()


def test_copy_email_button_accessible_feedback(site_page: SitePage) -> None:
    page = site_page.page
    copy_btn = page.locator("#copy-email-btn")
    assert copy_btn.count() == 1
    box = copy_btn.bounding_box()
    assert box is not None and box["height"] >= 44

    copy_btn.click()
    assert "Copied" in copy_btn.inner_text()
    assert "copied" in page.locator("#copy-email-status").inner_text().lower()

