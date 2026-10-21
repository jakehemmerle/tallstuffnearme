import { test, expect } from "@playwright/test";
import { MOCK_GEOJSON } from "./fixtures";

test.describe("Map", () => {
  test("loads and shows markers", async ({ page }) => {
    await page.route("**/objects", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_GEOJSON),
      })
    );

    const apiPromise = page.waitForRequest("**/objects");
    await page.goto("/");
    await apiPromise;

    await expect(page.locator("[data-testid='object-count']")).toHaveText(
      "1 objects",
      { timeout: 10000 }
    );
  });

  test("click marker opens object details", async ({ page }) => {
    await page.route("**/objects", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_GEOJSON),
      })
    );

    await page.goto("/");
    await expect(page.locator("[data-testid='object-count']")).toHaveText(
      "1 objects",
      { timeout: 10000 }
    );

    await page.locator("canvas").click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("pan triggers re-fetch", async ({ page }) => {
    let requestCount = 0;
    await page.route("**/objects", (route) => {
      requestCount++;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_GEOJSON),
      });
    });

    await page.goto("/");
    await expect(page.locator("[data-testid='object-count']")).toHaveText(
      "1 objects",
      { timeout: 10000 }
    );

    const initialCount = requestCount;

    await page.locator("canvas").press("ArrowRight");
    await expect.poll(() => requestCount).toBeGreaterThan(initialCount);
  });
});
