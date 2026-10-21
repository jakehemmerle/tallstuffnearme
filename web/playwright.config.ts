import { defineConfig, devices } from "@playwright/test";

const realApi = process.env.PLAYWRIGHT_REAL_API === "1";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL || (realApi ? "http://127.0.0.1:3001" : "http://localhost:3000");

export default defineConfig({
  testDir: "./e2e",
  testMatch: realApi ? "**/acceptance.spec.ts" : /^(?!.*acceptance\.spec\.ts$).*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL,
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: externalBaseURL ? undefined : {
    command: process.env.PLAYWRIGHT_SERVER_COMMAND || (realApi ? "cd .. && bun src/index.ts" : "bun run dev"),
    url: `${baseURL}${realApi ? "/readyz" : ""}`,
    reuseExistingServer: !process.env.CI,
  },
});
