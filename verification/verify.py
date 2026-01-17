
from playwright.sync_api import sync_playwright

def verify(page):
    page.goto('http://localhost:3001')

    # Check if the controls are present
    page.wait_for_selector('[aria-label="Controls"]')

    # Check for the select with new aria-label
    select = page.locator('select[aria-label="Training Method"]')
    if select.count() == 0:
        print('Select not found')
        # return # Continue to screenshot anyway to see state

    # Generate data to enable train button
    # The button text might be specific, let's look at the ControlPanel.jsx or the UI.
    # ControlPanel has '2. Train' and '3. Simulation'.
    # '1. Data' button is NOT in ControlPanel.jsx. It must be in App.jsx or another component.

    # Let's just screenshot the control panel first to verify static changes.
    page.locator('.control-panel').screenshot(path='verification/control_panel.png')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify(page)
    except Exception as e:
        print(f'Error: {e}')
    finally:
        browser.close()
