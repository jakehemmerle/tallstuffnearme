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

    await expect(page.locator("h1")).toHaveText("Tall Shit Near Me");
  });

  test("object details open on mobile", async ({ page }) => {
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

    await expect(
      page.locator("[data-testid='type-filter-button']")
    ).toBeVisible();

    await page.locator("[data-testid='type-filter-button']").click();
    await expect(page.locator("label", { hasText: "Tower" }).first()).toBeVisible();
  });
});
