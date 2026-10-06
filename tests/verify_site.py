import os
import sys
import time
from playwright.sync_api import sync_playwright

def verify_portfolio():
    print("Starting Playwright verification tests...")
    
    file_path = os.path.abspath("index.html").replace("\\", "/")
    file_url = f"file:///{file_path}"
    
    if not os.path.exists("index.html"):
        print("Error: index.html not found in the current directory.")
        sys.exit(1)
        
    console_errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant clipboard permissions for copy test
        context = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
        page = context.new_page()
        
        # Register console and error listeners
        page.on("pageerror", lambda err: console_errors.append(f"Runtime Exception: {err}"))
        page.on("console", lambda msg: console_errors.append(f"Console Error: {msg.text}") if msg.type == "error" else None)
        
        print(f"Loading page: {file_url}")
        page.goto(file_url)
        page.wait_for_load_state("networkidle")
        
        # 1. Assert Page Title
        title = page.title()
        expected_title = "Umar Usmoni — Cybersecurity Student & AI Engineer"
        assert title == expected_title, f"Incorrect page title: {title}"
        print("[OK] Page title verified successfully.")
        
        # 2. Assert Content Security Policy
        csp_meta = page.locator('meta[http-equiv="Content-Security-Policy"]')
        assert csp_meta.count() > 0, "Content-Security-Policy meta tag is missing!"
        csp_content = csp_meta.get_attribute("content")
        assert "default-src 'self'" in csp_content, f"Weak CSP content: {csp_content}"
        print("[OK] Content-Security-Policy meta tag verified successfully.")
        
        # 3. Assert Referrer Policy
        referrer_meta = page.locator('meta[name="referrer"]')
        assert referrer_meta.count() > 0, "Referrer meta tag is missing!"
        assert referrer_meta.get_attribute("content") == "no-referrer-when-downgrade", "Incorrect referrer policy!"
        print("[OK] Referrer-Policy meta tag verified successfully.")
        
        # 4. Assert noopener noreferrer on target="_blank" links
        anchors = page.locator('a[target="_blank"]')
        count = anchors.count()
        print(f"Checking {count} links with target='_blank'...")
        for i in range(count):
            anchor = anchors.nth(i)
            href = anchor.get_attribute("href")
            rel = anchor.get_attribute("rel") or ""
            assert "noopener" in rel and "noreferrer" in rel, f"Insecure target='_blank' link found for href='{href}' (rel='{rel}')"
        print("[OK] All target='_blank' links have noopener noreferrer verified.")
        
        # 5. Assert Hero Status Badge
        badge = page.locator('.hero-status-badge')
        assert badge.count() > 0, "Hero status badge is missing!"
        assert "Available for Opportunities" in badge.inner_text(), "Hero status badge text incorrect!"
        print("[OK] Hero status badge verified.")

        # 6. Assert Scroll Progress Bar & Back to Top Button
        progress = page.locator('#scroll-progress')
        assert progress.count() > 0, "Scroll progress bar is missing!"
        back_to_top = page.locator('#back-to-top')
        assert back_to_top.count() > 0, "Back to top button is missing!"

        # Scroll page down
        page.evaluate("window.scrollTo(0, 1000)")
        page.wait_for_timeout(300)
        assert "visible" in (back_to_top.get_attribute("class") or ""), "Back to top button did not become visible after scroll!"
        back_to_top.click()
        page.wait_for_timeout(400)
        print("[OK] Scroll progress and back-to-top verified.")

        # 7. Assert Skill Category Filters
        filter_sec = page.locator('.skill-filter-btn[data-filter="Security"]')
        assert filter_sec.count() > 0, "Security filter button missing!"
        filter_sec.click()
        page.wait_for_timeout(200)

        sec_cat = page.locator('.skill-category[data-category="Security"]')
        lang_cat = page.locator('.skill-category[data-category="Languages"]')
        assert "filtered-out" not in (sec_cat.get_attribute("class") or ""), "Security category should be visible!"
        assert "filtered-out" in (lang_cat.get_attribute("class") or ""), "Languages category should be filtered out!"

        filter_all = page.locator('.skill-filter-btn[data-filter="all"]')
        filter_all.click()
        page.wait_for_timeout(200)
        assert "filtered-out" not in (lang_cat.get_attribute("class") or ""), "All filter should restore all categories!"
        print("[OK] Skill category filters verified.")

        # 8. Assert SentinelHash Widget (Web Crypto)
        sentinel_input = page.locator('#sentinel-input')
        sentinel_hash = page.locator('#sentinel-hash')
        sentinel_select = page.locator('#sentinel-algo')
        sentinel_copy = page.locator('#sentinel-copy')
        assert sentinel_input.count() > 0 and sentinel_hash.count() > 0, "SentinelHash elements missing!"

        # Type new text and verify hash computation
        sentinel_input.fill("test123")
        page.wait_for_timeout(200)
        hash_val = sentinel_hash.inner_text().strip()
        # SHA-256 for "test123" is ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae
        assert len(hash_val) == 64, f"Expected 64-char hex SHA-256 hash, got {len(hash_val)}: {hash_val}"
        assert hash_val == "ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae", f"Hash mismatch: {hash_val}"

        # Switch to SHA-512
        sentinel_select.select_option("SHA-512")
        page.wait_for_timeout(200)
        hash_val_512 = sentinel_hash.inner_text().strip()
        assert len(hash_val_512) == 128, f"Expected 128-char hex SHA-512 hash, got {len(hash_val_512)}"

        # Click copy button
        sentinel_copy.click()
        page.wait_for_timeout(200)
        assert "Copied" in sentinel_copy.inner_text(), "Copy button text didn't update to Copied!"
        print("[OK] SentinelHash WebCrypto hashing and copy verified.")

        # 9. Assert CyberRecon Widget
        recon_headers_tab = page.locator('.recon-tab-btn[data-tab="headers"]')
        recon_ports_tab = page.locator('.recon-tab-btn[data-tab="ports"]')
        assert recon_headers_tab.count() > 0, "CyberRecon headers tab missing!"
        recon_headers_tab.click()
        page.wait_for_timeout(150)
        assert page.locator('#recon-headers').is_visible(), "Headers panel should be visible!"

        recon_ports_tab.click()
        page.wait_for_timeout(150)
        assert page.locator('#recon-ports').is_visible(), "Ports panel should be visible!"

        recon_run = page.locator('#recon-run-btn')
        recon_run.click()
        page.wait_for_timeout(800)
        assert "Audit Verified" in recon_run.inner_text(), "Recon audit button text did not confirm verification!"
        print("[OK] CyberRecon protocol inspector tabs and audit test verified.")

        # 10. Assert Certificate Lightbox Modal
        cert_preview = page.locator('.cert-img-wrapper').first
        cert_modal = page.locator('#cert-modal')
        cert_preview.click()
        page.wait_for_timeout(200)
        assert "active" in (cert_modal.get_attribute("class") or ""), "Certificate modal did not open on preview click!"
        assert page.locator('#cert-modal-img').get_attribute("src") != "", "Certificate modal image src is empty!"

        # Close via Escape key
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        assert "active" not in (cert_modal.get_attribute("class") or ""), "Certificate modal did not close on Escape key!"
        print("[OK] Certificate Lightbox Modal open and close verified.")

        # 11. Assert Terminal Simulator Commands
        term_input = page.locator('.terminal-input')
        assert term_input.count() > 0, "Terminal input not found!"
        
        # Test 'help'
        term_input.fill("help")
        page.keyboard.press("Enter")
        page.wait_for_timeout(150)
        term_output = page.locator('.terminal-output').inner_text()
        assert "certs" in term_output and "hash" in term_output and "stats" in term_output, "Help output missing new commands!"

        # Test 'certs'
        term_input.fill("certs")
        page.keyboard.press("Enter")
        page.wait_for_timeout(150)
        term_output = page.locator('.terminal-output').inner_text()
        assert "Umar Usmoni Usmonzoda" in term_output, "Certs command missing recipient name!"
        assert "Generative AI for Software Development" in term_output, "Certs command missing professional cert!"

        # Test 'hash terminal_test'
        term_input.fill("hash terminal_test")
        page.keyboard.press("Enter")
        page.wait_for_timeout(250)
        term_output = page.locator('.terminal-output').inner_text()
        assert "SHA-256(\"terminal_test\"):" in term_output, "Terminal hash command failed!"

        # Test 'theme cyan'
        term_input.fill("theme cyan")
        page.keyboard.press("Enter")
        page.wait_for_timeout(150)
        term_output = page.locator('.terminal-output').inner_text()
        assert "CYAN" in term_output, "Theme command failed!"
        print("[OK] Terminal simulator new commands (help, certs, hash, theme) verified.")

        # 12. Assert Zero Console / Runtime Errors
        if console_errors:
            print("\nVerification failed. Console/Runtime errors detected:")
            for err in console_errors:
                print(f"  - {err}")
            sys.exit(1)
            
        print("[OK] Zero console/runtime errors detected across all test interactions.")
        browser.close()
        
    print("\nAll 12 verification test suites passed with 100% success!")

if __name__ == "__main__":
    verify_portfolio()
