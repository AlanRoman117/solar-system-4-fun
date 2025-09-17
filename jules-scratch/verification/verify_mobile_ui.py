import os
from playwright.sync_api import sync_playwright, expect

def run_test():
    with sync_playwright() as p:
        # Use a mobile viewport
        iphone_11 = p.devices['iPhone 11']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(**iphone_11)
        page = context.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        page.goto(f'file://{file_path}')

        # 1. Verify the hamburger menu is visible
        hamburger_menu = page.locator('#hamburger-menu')
        expect(hamburger_menu).to_be_visible()

        # 2. Verify the planet list is hidden
        planet_list = page.locator('#planet-list')
        expect(planet_list).to_be_hidden()

        # 3. Click the hamburger menu
        hamburger_menu.click()

        # 4. Verify the 'show-list' class is added
        expect(planet_list).to_have_class('show-list')

        # 5. Verify the planet list is now visible
        expect(planet_list).to_be_visible()

        # 6. Click on "Earth" in the planet list
        earth_link = page.get_by_role("listitem").filter(has_text="Earth")
        earth_link.click()

        # 7. Verify the "Learn More" button appears
        learn_more_button = page.locator('#learn-more-button')
        expect(learn_more_button).to_be_visible()
        expect(learn_more_button).to_have_text('Learn more about Earth')

        # 8. Click the "Learn More" button to show the panel
        learn_more_button.click()

        # 9. Verify the planet info panel is visible
        planet_info_panel = page.locator('#planet-info-panel')
        expect(planet_info_panel).to_be_visible()

        # 10. Click the "Learn More" button again to hide the panel
        learn_more_button.click()

        # 11. Verify the planet info panel is hidden
        expect(planet_info_panel).to_be_hidden()

        # 12. Take a screenshot
        page.screenshot(path='jules-scratch/verification/verification.png')

        browser.close()

if __name__ == '__main__':
    run_test()
