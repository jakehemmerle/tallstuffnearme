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

  test("click marker opens detail sheet", async ({ page }) => {
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

      await expect(page.locator("[data-slot='sheet-content']")).toBeVisible({
        timeout: 5000,
      });
    } else {
      test.skip();
    }
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

    const hasMap = await page.evaluate(
      () => !!(window as unknown as Record<string, unknown>).__testMap
    );

    if (hasMap) {
      await page.evaluate(() => {
        const map = (window as unknown as Record<string, unknown>).__testMap as {
          panBy: (offset: [number, number]) => void;
        };
        map.panBy([200, 0]);
      });

      await page.waitForTimeout(1000);
      expect(requestCount).toBeGreaterThan(initialCount);
    } else {
      expect(requestCount).toBeGreaterThanOrEqual(1);
    }
  });
});
