import { test as base, type Page } from "@playwright/test";

export const CREDENTIALS = {
  hr: { email: "admin@hrms.com", password: "admin123", label: "Login as HR Admin" },
  manager: { email: "manager@hrms.com", password: "mgr123", label: "Login as Manager" },
  employee: { email: "emp@hrms.com", password: "emp123", label: "Login as Employee" },
} as const;

export type Role = keyof typeof CREDENTIALS;

/**
 * Log in as the given role via the quick-login button and wait for dashboard.
 */
export async function loginAs(page: Page, role: Role): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: CREDENTIALS[role].label }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
}

export const test = base.extend<{ authenticatedPage: Page; role: Role }>({
  role: ["hr", { option: true }],
  authenticatedPage: async ({ page, role }, use) => {
    await loginAs(page, role);
    await use(page);
  },
});

export { expect } from "@playwright/test";
