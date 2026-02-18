import { test, expect } from "./fixtures/auth";

test.describe("Key pages (HR)", () => {
  test("Employees list loads", async ({ authenticatedPage: page }) => {
    await page.goto("/employees");
    await expect(page).toHaveURL(/\/employees/);
    await expect(page.getByRole("heading", { name: /employees/i })).toBeVisible({ timeout: 15_000 });
  });

  test("Attendance page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/attendance");
    await expect(page).toHaveURL(/\/attendance/);
    await expect(page.getByRole("heading", { name: /attendance/i })).toBeVisible({ timeout: 15_000 });
  });

  test("Leave page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/leave");
    await expect(page).toHaveURL(/\/leave/);
    await expect(page.getByRole("heading", { name: /leave/i }).or(page.getByText(/apply leave|my leave/i))).toBeVisible({ timeout: 15_000 });
  });

  test("Payroll page loads (HR only)", async ({ authenticatedPage: page }) => {
    await page.goto("/payroll");
    await expect(page).toHaveURL(/\/payroll/);
    await expect(page.getByRole("heading", { name: /payroll/i }).or(page.getByText(/payroll/i))).toBeVisible({ timeout: 15_000 });
  });

  test("Recruitment page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/recruitment");
    await expect(page).toHaveURL(/\/recruitment/);
    await expect(page.getByRole("heading", { name: /recruitment/i }).or(page.getByText(/job|recruitment/i))).toBeVisible({ timeout: 15_000 });
  });

  test("Helpdesk page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/helpdesk");
    await expect(page).toHaveURL(/\/helpdesk/);
    await expect(page.getByRole("heading", { name: /helpdesk/i }).or(page.getByText(/ticket|helpdesk/i))).toBeVisible({ timeout: 15_000 });
  });

  test("Reports page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/reports/);
    await expect(page.getByRole("heading", { name: /reports/i }).or(page.getByText(/attendance|payroll|report/i))).toBeVisible({ timeout: 15_000 });
  });

  test("Admin Roles page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/roles");
    await expect(page).toHaveURL(/\/admin\/roles/);
    await expect(page.getByRole("heading", { name: /roles|permissions/i }).or(page.getByText(/role|permission/i))).toBeVisible({ timeout: 15_000 });
  });

  test("Audit Logs page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/admin/audit-logs");
    await expect(page).toHaveURL(/\/admin\/audit-logs/);
    await expect(page.getByRole("heading", { name: /audit/i }).or(page.getByText(/audit|log/i))).toBeVisible({ timeout: 15_000 });
  });

  test("Training page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/training");
    await expect(page).toHaveURL(/\/training/);
    await expect(page.getByRole("heading", { name: /training/i }).or(page.getByText(/training|course/i))).toBeVisible({ timeout: 15_000 });
  });

  test("Benefits page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/benefits");
    await expect(page).toHaveURL(/\/benefits/);
    await expect(page.getByRole("heading", { name: /benefits/i }).or(page.getByText(/benefit/i))).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Employee-only pages", () => {
  test.use({ role: "employee" });

  test("ESS page loads for employee", async ({ authenticatedPage: page }) => {
    await page.goto("/ess");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test("Employee redirected from ESS when not employee role", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Login as HR Admin" }).click();
    await page.waitForURL(/\/dashboard/);
    await page.goto("/ess");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
