
from playwright.sync_api import sync_playwright

def verify_a11y(page):
    page.goto("http://localhost:4173")

    # 1. Verify Navigation
    # Check if nav element exists with aria-label
    nav = page.get_by_role("navigation", name="Phase Navigation")
    if not nav.is_visible():
        raise Exception("Navigation landmark not found")

    # Check if aria-current is applied to the active link (Linear Regression is default)
    # The default link text is "Phase 1 (Linear)"
    active_link = nav.get_by_role("link", name="Phase 1 (Linear)")

    # We need to check the attribute directly
    aria_current = active_link.get_attribute("aria-current")
    if aria_current != "page":
        raise Exception(f"Expected aria-current='page' on active link, got '{aria_current}'")

    print("Navigation accessibility verification passed.")

    # Take a screenshot
    page.screenshot(path="verification/a11y_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_a11y(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            exit(1)
        finally:
            browser.close()
