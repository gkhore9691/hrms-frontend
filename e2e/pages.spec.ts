import { test, expect } from "./fixtures/auth";

test.describe("Key pages (HR)", () => {
  test("Employees list loads", async ({ authenticatedPage: page }) => {
    await page.goto("/employees");
    await expect(page).toHaveURL(/\/employees/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });

  test("Attendance page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/attendance");
    await expect(page).toHaveURL(/\/attendance/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });

  test("Leave page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/leave");
    await expect(page).toHaveURL(/\/leave/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Payroll page loads (HR only)", async ({ authenticatedPage: page }) => {
    await page.goto("/payroll");
    await expect(page).toHaveURL(/\/payroll/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });

  test("Recruitment page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/recruitment");
    await expect(page).toHaveURL(/\/recruitment/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Helpdesk page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/helpdesk");
    await expect(page).toHaveURL(/\/helpdesk/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Reports page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/reports/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });
  });

  test("Admin Roles page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/roles");
    await expect(page).toHaveURL(/\/admin\/roles/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });

  test("Audit Logs page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/audit-logs");
    await expect(page).toHaveURL(/\/admin\/audit-logs/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });

  test("Training page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/training");
    await expect(page).toHaveURL(/\/training/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });

  test("Benefits page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/benefits");
    await expect(page).toHaveURL(/\/benefits/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Employee-only pages", () => {
  test.use({ role: "employee" });

  test("ESS page loads for employee", async ({ authenticatedPage: page }) => {
    await page.goto("/ess");
    await expect(page).toHaveURL(/\/ess/);
    await expect(page.locator("main").getByRole("heading", { name: "Self Service" })).toBeVisible({ timeout: 10_000 });
  });

  test("Employee redirected from ESS when not employee role", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Login as HR Admin" }).click();
    await page.waitForURL(/\/dashboard/);
    await page.goto("/ess");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
