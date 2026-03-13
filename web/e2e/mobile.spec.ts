import { test, expect } from "@playwright/test";
import { MOCK_GEOJSON } from "./fixtures";

test.describe("Mobile", () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test("mobile layout renders correctly", async ({ page }) => {
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

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    await expect(page.locator("h1")).toHaveText("Tall Stuff Near Me");
  });

  test("detail sheet opens from bottom on mobile", async ({ page }) => {
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

    const hasMap = await page.evaluate(
      () => !!(window as unknown as Record<string, unknown>).__testMap
    );

    if (hasMap) {
      const pixel = await page.evaluate(() => {
        const map = (window as unknown as Record<string, unknown>).__testMap as {
          project: (lngLat: [number, number]) => { x: number; y: number };
        };
        const p = map.project([-98.6, 39.8]);
        return { x: p.x, y: p.y };
      });

      await page.locator("canvas").click({
        position: { x: pixel.x, y: pixel.y },
      });

      const sheet = page.locator("[data-slot='sheet-content']");
      await expect(sheet).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test("filters accessible on mobile", async ({ page }) => {
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

    await expect(page.locator("[data-testid='height-slider']")).toBeVisible();

    await expect(
      page.locator("[data-testid='type-filter-button']")
    ).toBeVisible();

    await page.locator("[data-testid='type-filter-button']").click();
    await expect(page.locator("label", { hasText: "Tower" }).first()).toBeVisible();
  });
});
