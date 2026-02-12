from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:4173/")
        page.wait_for_selector('rect[role="button"]')

        toggle = page.locator('rect[role="button"]').first

        print("Checking accessibility...")
        # Check role
        role = toggle.get_attribute("role")
        print(f"Role: {role}")

        # Check tabIndex (might be 'tabindex' or 'tabIndex')
        tabindex = toggle.get_attribute("tabindex")
        if not tabindex:
            tabindex = toggle.get_attribute("tabIndex")
        print(f"TabIndex attribute: {tabindex}")

        # Test Keyboard Interaction
        print("Focusing and Pressing Enter to toggle...")
        try:
            toggle.focus()
            page.keyboard.press("Enter")
            page.wait_for_timeout(500)

            # Verify state change
            is_expanded = toggle.get_attribute("aria-expanded")
            label = toggle.get_attribute("aria-label")
            print(f"State after Enter: Expanded={is_expanded}, Label='{label}'")

            if is_expanded == "true" and label == "Collapse model details":
                print("SUCCESS: Keyboard interaction worked.")
            else:
                print("FAILURE: Keyboard interaction did not toggle state.")

        except Exception as e:
            print(f"FAILURE: Exception during interaction: {e}")

        browser.close()

if __name__ == "__main__":
    run()
