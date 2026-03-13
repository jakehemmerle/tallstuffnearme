import { test, expect } from "@playwright/test";
import { makeMockGeoJson } from "./fixtures";

test.describe("Filters", () => {
  test("height slider filters results", async ({ page }) => {
    const requests: { minHeight?: number }[] = [];

    await page.route("**/objects", async (route) => {
      const postData = route.request().postDataJSON();
      requests.push(postData);
      const minH = postData.minHeight || 0;
      const count = minH >= 500 ? 2 : 5;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeMockGeoJson(count)),
      });
    });

    await page.goto("/");
    await expect(page.locator("[data-testid='object-count']")).toHaveText(
      "5 objects",
      { timeout: 10000 }
    );

    const slider = page.locator("[data-testid='height-slider']");
    const sliderBox = await slider.boundingBox();
    expect(sliderBox).not.toBeNull();

    await slider.click({
      position: { x: sliderBox!.width * 0.5, y: sliderBox!.height / 2 },
    });

    await expect(page.locator("[data-testid='object-count']")).toHaveText(
      "2 objects",
      { timeout: 10000 }
    );

    const lastRequest = requests[requests.length - 1];
    expect(lastRequest.minHeight).toBeGreaterThan(100);
  });

  test("object type filter excludes types", async ({ page }) => {
    const requests: { excludeObjectTypes?: string[] }[] = [];

    await page.route("**/objects", async (route) => {
      const postData = route.request().postDataJSON();
      requests.push(postData);
      const excludeTypes = postData.excludeObjectTypes || [];
      const features = excludeTypes.includes("TOWER")
        ? []
        : makeMockGeoJson(3).features;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ type: "FeatureCollection", features }),
      });
    });

    await page.goto("/");
    await expect(page.locator("[data-testid='object-count']")).toHaveText(
      "3 objects",
      { timeout: 10000 }
    );

    await page.locator("[data-testid='type-filter-button']").click();

    const towerLabel = page.locator("label", { hasText: "Tower" }).first();
    await expect(towerLabel).toBeVisible();
    await towerLabel.locator("button").click();

    await expect(page.locator("[data-testid='object-count']")).toHaveText(
      "0 objects",
      { timeout: 10000 }
    );

    const lastRequest = requests[requests.length - 1];
    expect(lastRequest.excludeObjectTypes).toContain("TOWER");
  });
});
