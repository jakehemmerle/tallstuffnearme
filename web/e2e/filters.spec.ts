import { test, expect } from "@playwright/test";
import { makeMockGeoJson } from "./fixtures";

test.describe("Filters", () => {
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
