import { test, expect } from "@playwright/test";

test.use({
  geolocation: { latitude: 39.14, longitude: -84.51, accuracy: 1000 },
  permissions: ["geolocation"],
});

test("the packaged API serves seeded PostgreSQL records", async ({ request }) => {
  const readiness = await request.get("/readyz");
  expect(readiness.status()).toBe(200);
  expect(await readiness.json()).toEqual({ ok: true });

  const objects = await request.post("/objects", {
    data: {
      bounds: {
        sw: { latitude: 39.13, longitude: -84.52 },
        ne: { latitude: 39.15, longitude: -84.50 },
      },
      center: { latitude: 39.14, longitude: -84.51 },
      minHeight: 500,
    },
  });
  expect(objects.status()).toBe(200);
  expect(await objects.json()).toMatchObject({
    type: "FeatureCollection",
    features: [{ properties: { OASNumber: 99000001, City: "CINCINNATI", AGL: 600 } }],
  });
});

test("the map loads records and applies type filters through the real API", async ({ page }) => {
  const initialObjects = page.waitForResponse(response =>
    response.url().endsWith("/objects") && response.request().method() === "POST" && response.ok()
  );
  await page.goto("/");
  await initialObjects;
  await page.getByRole("button", { name: "Find my location" }).click();
  await expect(page.getByTestId("object-count")).toHaveText("2 objects", { timeout: 15_000 });

  await page.getByTestId("type-filter-button").click();
  const tower = page.getByRole("checkbox", { name: "Tower", exact: true });
  await tower.uncheck();
  await expect(page.getByTestId("object-count")).toHaveText("0 objects");
  await tower.check();
  await expect(page.getByTestId("object-count")).toHaveText("2 objects");
});
