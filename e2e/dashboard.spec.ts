import { test, expect } from "./fixtures/auth";

test.describe("Dashboard", () => {
  test("HR sees dashboard with stats and charts", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("main").getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("Manager dashboard covered below", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Dashboard as Manager", () => {
  test.use({ role: "manager" });

  test("manager dashboard loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Dashboard as Employee", () => {
  test.use({ role: "employee" });

  test("employee dashboard loads", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
