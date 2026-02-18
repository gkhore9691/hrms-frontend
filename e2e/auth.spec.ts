import { test, expect } from "@playwright/test";
import { CREDENTIALS, loginAs } from "./fixtures/auth";

test.describe("Login", () => {
  test("shows login form and quick login buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("button", { name: CREDENTIALS.hr.label })).toBeVisible();
    await expect(page.getByRole("button", { name: CREDENTIALS.manager.label })).toBeVisible();
    await expect(page.getByRole("button", { name: CREDENTIALS.employee.label })).toBeVisible();
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("wrong@hrms.com");
    await page.getByRole("textbox", { name: "Password" }).fill("wrong");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test("HR quick login redirects to dashboard", async ({ page }) => {
    await loginAs(page, "hr");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Manager quick login redirects to dashboard", async ({ page }) => {
    await loginAs(page, "manager");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Employee quick login redirects to dashboard", async ({ page }) => {
    await loginAs(page, "employee");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("unauthenticated user visiting dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
