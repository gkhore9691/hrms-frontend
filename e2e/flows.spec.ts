import { test, expect } from "./fixtures/auth";

test.describe("Leave flow", () => {
  test.use({ role: "employee" });

  test("Apply Leave tab is visible and has leave type selection", async ({ authenticatedPage: page }) => {
    await page.goto("/leave");
    await expect(page).toHaveURL(/\/leave/);
    const applyTab = page.getByRole("tab", { name: /apply/i });
    await expect(applyTab).toBeVisible({ timeout: 15_000 });
    await applyTab.click();
    await expect(page.getByText(/leave type|annual|sick|casual|balance/i)).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Attendance flow", () => {
  test.use({ role: "employee" });

  test("Attendance page shows check-in or today status", async ({ authenticatedPage: page }) => {
    await page.goto("/attendance");
    await expect(page).toHaveURL(/\/attendance/);
    await expect(
      page.getByRole("button", { name: /check in/i }).or(page.getByText(/checked in|hours worked|check out|today/i))
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Helpdesk flow", () => {
  test.use({ role: "employee" });

  test("Can open raise ticket and see category options", async ({ authenticatedPage: page }) => {
    await page.goto("/helpdesk");
    await expect(page).toHaveURL(/\/helpdesk/);
    const raiseBtn = page.getByRole("button", { name: /raise|new ticket/i }).first();
    await expect(raiseBtn).toBeVisible({ timeout: 15_000 });
    await raiseBtn.click();
    await expect(page.getByText(/category|payroll|leave|attendance|reimbursement|subject/i)).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Recruitment flow (HR)", () => {
  test("Recruitment list shows jobs and link to candidates", async ({ authenticatedPage: page }) => {
    await page.goto("/recruitment");
    await expect(page).toHaveURL(/\/recruitment/);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    const viewCandidates = page.getByRole("link", { name: /view candidates|candidates/i }).first();
    if (await viewCandidates.isVisible()) {
      await viewCandidates.click();
      await expect(page).toHaveURL(/\/recruitment\/.+\/candidates/);
    }
  });
});

test.describe("Employee detail (HR)", () => {
  test("Can open an employee and see tabs", async ({ authenticatedPage: page }) => {
    await page.goto("/employees");
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    const firstRowLink = page.getByRole("link", { name: /EMP\d+/ }).first();
    if (await firstRowLink.isVisible()) {
      await firstRowLink.click();
      await expect(page).toHaveURL(/\/employees\/EMP/);
      await expect(page.getByRole("tab", { name: /overview|personal|documents/i })).toBeVisible({ timeout: 8000 });
    }
  });
});

test.describe("Navigation", () => {
  test("Sidebar nav links work", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    const employeesLink = page.locator("aside").getByRole("link", { name: "Employees" });
    await expect(employeesLink).toBeVisible({ timeout: 10_000 });
    await employeesLink.click();
    await expect(page).toHaveURL(/\/employees/);
    const leaveLink = page.locator("aside").getByRole("link", { name: "Leave" });
    await expect(leaveLink).toBeVisible({ timeout: 5000 });
    await leaveLink.click();
    await expect(page).toHaveURL(/\/leave/);
  });

  test("Topbar user menu has logout", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    const header = page.locator("header");
    const buttons = header.getByRole("button");
    await expect(buttons.first()).toBeVisible({ timeout: 10_000 });
    await buttons.last().click();
    await expect(page.getByRole("menuitem", { name: /logout/i })).toBeVisible({ timeout: 5000 });
  });
});
