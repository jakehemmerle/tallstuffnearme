import { test, expect } from "@playwright/test";
import { makeMockGeoJson, MOCK_GEOJSON } from "./fixtures";

test("a failed search shows an error and can be retried", async ({ page }) => {
  let unavailable = true;
  await page.route("**/objects", (route) =>
    route.fulfill({
      status: unavailable ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(unavailable ? { error: "Unavailable" } : MOCK_GEOJSON),
    })
  );

  const error = page.getByRole("alert").filter({ hasText: "Could not load objects." });
  const failedResponse = page.waitForResponse(response => response.url().endsWith("/objects") && response.status() === 503);
  await page.goto("/");
  await failedResponse;
  await expect(error).toBeVisible();
  await expect(page.getByTestId("object-count")).toHaveText("Objects unavailable");

  unavailable = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByTestId("object-count")).toHaveText("1 objects");
  await expect(error).toHaveCount(0);
});

test("a failed refresh does not keep a stale result count", async ({ page }) => {
  let unavailable = false;
  await page.route("**/objects", (route) =>
    route.fulfill({
      status: unavailable ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(unavailable ? { error: "Unavailable" } : MOCK_GEOJSON),
    })
  );

  const error = page.getByRole("alert").filter({ hasText: "Could not load objects." });
  const initialResponse = page.waitForResponse(response => response.url().endsWith("/objects") && response.ok());
  await page.goto("/");
  await initialResponse;
  await expect(page.getByTestId("object-count")).toHaveText("1 objects");

  unavailable = true;
  const failedRequest = page.waitForRequest("**/objects");
  await page.locator("canvas").press("ArrowRight");
  await failedRequest;
  await expect(error).toBeVisible();
  await expect(page.getByTestId("object-count")).toHaveText("Objects unavailable");
  await expect(error).toContainText("Map data may be out of date.");

  await page.getByTestId("type-filter-button").click();
  const latestRequest = page.waitForRequest("**/objects");
  await page.getByRole("checkbox", { name: "Tower", exact: true }).uncheck();
  const latestQuery = (await latestRequest).postDataJSON();
  await expect(error).toBeVisible();
  await page.keyboard.press("Escape");

  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("Map canvas is missing");
  const { bounds } = latestQuery;
  const mercator = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));
  await page.locator("canvas").click({ position: {
    x: (-98.6 - bounds.sw.longitude) / (bounds.ne.longitude - bounds.sw.longitude) * box.width,
    y: (mercator(bounds.ne.latitude) - mercator(39.8)) / (mercator(bounds.ne.latitude) - mercator(bounds.sw.latitude)) * box.height,
  } });
  await expect(page.getByRole("dialog")).toContainText("10000");
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();

  unavailable = false;
  const retryRequest = page.waitForRequest("**/objects");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  expect((await retryRequest).postDataJSON()).toEqual(latestQuery);
  await expect(page.getByTestId("object-count")).toHaveText("1 objects");
  await expect(error).toHaveCount(0);
});

test("a superseded response cannot replace the current search", async ({ page }) => {
  const previousStarted = Promise.withResolvers<void>();
  const releasePrevious = Promise.withResolvers<void>();
  let requests = 0;
  await page.route("**/objects", async (route) => {
    requests++;
    if (requests === 1) return route.fulfill({ json: MOCK_GEOJSON });
    if (!route.request().postDataJSON().excludeObjectTypes?.includes("TOWER")) {
      previousStarted.resolve();
      await releasePrevious.promise;
      return route.fulfill({ json: makeMockGeoJson(0) });
    }
    return route.fulfill({ json: makeMockGeoJson(2, "BUILDING") });
  });

  const initialResponse = page.waitForResponse(response => response.url().endsWith("/objects") && response.ok());
  await page.goto("/");
  await initialResponse;
  await expect(page.getByTestId("object-count")).toHaveText("1 objects");
  const observedCounts = page.evaluate(() => new Promise<string[]>(resolve => {
    const badge = document.querySelector('[data-testid="object-count"]');
    if (!badge) throw new Error("Object count is missing");
    const counts: string[] = [];
    const observer = new MutationObserver(() => {
      const count = badge.textContent ?? "";
      counts.push(count);
      if (count === "2 objects") {
        observer.disconnect();
        resolve(counts);
      }
    });
    observer.observe(badge, { childList: true, characterData: true, subtree: true });
  }));

  await page.locator("canvas").press("ArrowRight");
  await previousStarted.promise;
  await page.getByTestId("type-filter-button").click();
  await page.getByRole("checkbox", { name: "Tower", exact: true }).uncheck();
  releasePrevious.resolve();
  await expect(page.getByTestId("object-count")).toHaveText("2 objects");
  expect(await observedCounts).not.toContain("0 objects");
});
