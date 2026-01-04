from playwright.sync_api import sync_playwright

def verify_ux_improvements():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://localhost:5173")

        # Wait for the navigation to appear
        page.wait_for_selector("nav[aria-label='Phasen-Auswahl']")

        # Verify navigation structure
        nav = page.locator("nav[aria-label='Phasen-Auswahl']")
        print(f"Navigation found with label: {nav.get_attribute('aria-label')}")

        # Verify active link attributes
        active_link = nav.locator("a[aria-current='page']")
        print(f"Active link text: {active_link.text_content()}")
        print(f"Active link has aria-current: {active_link.get_attribute('aria-current')}")

        # Take a screenshot of the navigation
        page.screenshot(path="verification/navigation_verification.png")

        # Verify Control Panel improvements
        # Note: ControlPanel is rendered inside the Phase component.
        # Physics phase is default.

        # Verify select label
        select = page.locator("select[aria-label='Trainingsmethode auswählen']")
        print(f"Select found with label: {select.get_attribute('aria-label')}")

        # Verify button tooltip (title)
        train_btn = page.locator("button", has_text="2. Trainieren")
        print(f"Train button title: {train_btn.get_attribute('title')}")

        sim_btn = page.locator("button", has_text="3. Simulation Starten")
        # Sim button is enabled by default in physics mode? Let's check.
        # Physics simulation starts running automatically or waits?
        # In PhysicsPhase, ControlPanel is used.
        # Let's check if the button has a title.
        print(f"Sim button title: {sim_btn.get_attribute('title')}")

        page.screenshot(path="verification/control_panel_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_ux_improvements()
