import { test, expect } from "./fixtures/auth";

/**
 * Additional page coverage: routes not in pages.spec.ts
 * Ensures every UI route is hit by at least one E2E test.
 */

test.describe("HR-only pages (extra)", () => {
  test("Add Employee page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/employees/add");
    await expect(page).toHaveURL(/\/employees\/add/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/personal|add employee|step/i)).toBeVisible({ timeout: 8000 });
  });

  test("Org Chart page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/employees/org-chart");
    await expect(page).toHaveURL(/\/employees\/org-chart/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Onboarding list loads", async ({ authenticatedPage: page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Shift Management page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/attendance/shifts");
    await expect(page).toHaveURL(/\/attendance\/shifts/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Salary Structures page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/payroll/salary-structures");
    await expect(page).toHaveURL(/\/payroll\/salary-structures/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Notification Setup page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/notifications");
    await expect(page).toHaveURL(/\/admin\/notifications/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("User Management page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Shared pages (all roles)", () => {
  test("Leave Holidays page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/leave/holidays");
    await expect(page).toHaveURL(/\/leave\/holidays/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Payslips page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/payroll/payslips");
    await expect(page).toHaveURL(/\/payroll\/payslips/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Performance page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/performance");
    await expect(page).toHaveURL(/\/performance/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Profile page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Job detail and onboarding detail", () => {
  test("Job detail page loads from recruitment list", async ({ authenticatedPage: page }) => {
    await page.goto("/recruitment");
    await expect(page).toHaveURL(/\/recruitment/, { timeout: 15_000 });
    const jobLink = page.locator("main").getByRole("link", { name: /view|job|senior|engineer|hr/i }).first();
    if (await jobLink.isVisible()) {
      await jobLink.click();
      await expect(page).toHaveURL(/\/recruitment\/[^/]+\/?$/);
      await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
    }
  });

  test("Onboarding detail opens from list", async ({ authenticatedPage: page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
    const viewLink = page.locator("main").getByRole("link", { name: /view/i }).first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      await expect(page).toHaveURL(/\/onboarding\/.+/);
      await expect(page.locator("main").getByText(/progress|checklist|task/i)).toBeVisible({ timeout: 8000 });
    }
  });
});
