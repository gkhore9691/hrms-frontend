import { test, expect } from "./fixtures/auth";

/**
 * Additional flow coverage: key UI interactions beyond pages.spec + flows.spec
 */

test.describe("Performance (HR)", () => {
  test("Performance page has Goals or Reviews tab", async ({ authenticatedPage: page }) => {
    await page.goto("/performance");
    await expect(page).toHaveURL(/\/performance/);
    await expect(
      page.getByRole("tab", { name: /goals|reviews|cycles/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Leave (Manager)", () => {
  test.use({ role: "manager" });

  test("Team Leaves or My Leaves visible", async ({ authenticatedPage: page }) => {
    await page.goto("/leave");
    await expect(page).toHaveURL(/\/leave/);
    await expect(
      page.getByRole("tab", { name: /team|my leave|apply/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Payroll (HR)", () => {
  test("Payroll run or summary visible", async ({ authenticatedPage: page }) => {
    await page.goto("/payroll");
    await expect(page).toHaveURL(/\/payroll/);
    await expect(page.getByText(/payroll|run|draft|processed|month/i)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Admin Roles (HR)", () => {
  test("Roles table and Edit or Create visible", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/roles");
    await expect(page).toHaveURL(/\/admin\/roles/);
    await expect(
      page.getByRole("button", { name: /edit|create|add role/i }).or(page.getByText(/role|permission/i))
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Topbar and layout", () => {
  test("Notifications bell visible when logged in", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: /notification/i })).toBeVisible({ timeout: 10_000 });
  });

  test("Profile link in user menu", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    const header = page.locator("header");
    await header.getByRole("button").last().click();
    await expect(page.getByRole("menuitem", { name: /profile/i })).toBeVisible({ timeout: 5000 });
  });
});
