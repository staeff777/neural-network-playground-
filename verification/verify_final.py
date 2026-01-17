
from playwright.sync_api import sync_playwright

def verify(page):
    page.goto('http://localhost:3001')
    page.wait_for_selector('[aria-label="Controls"]')
    # Just take a screenshot to confirm it loads
    page.locator('.control-panel').screenshot(path='verification/control_panel_final.png')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify(page)
    except Exception as e:
        print(f'Error: {e}')
    finally:
        browser.close()
