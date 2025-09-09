import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the local server
        await page.goto("http://localhost:8000/index.html")

        # Wait for the planet list to be populated (Sun + 9 planets)
        await expect(page.locator("#planet-list li")).to_have_count(10, timeout=10000)

        # Click on Mercury
        mercury_link = page.get_by_role("listitem").filter(has_text="Mercury")
        await mercury_link.click()

        # Wait for the camera animation to complete
        await page.wait_for_timeout(5000) # 5 seconds

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/mercury_view.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
