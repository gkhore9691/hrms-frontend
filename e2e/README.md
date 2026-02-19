# E2E tests (Playwright)

End-to-end tests for the PeopleOS HRMS UI.

## Run tests

```bash
# Start dev server and run all tests (Chromium)
npm run test:e2e

# Run with UI mode (inspect and debug)
npm run test:e2e:ui

# Run a single file
npx playwright test e2e/auth.spec.ts

# Run with a specific project (browser)
npx playwright test --project=chromium
```

## Structure

- **`fixtures/auth.ts`** – Login helper `loginAs(page, role)` and authenticated fixture for HR / Manager / Employee.
- **`auth.spec.ts`** – Login form, invalid credentials, quick login for all roles, redirect when unauthenticated.
- **`dashboard.spec.ts`** – Dashboard loads for HR, Manager, Employee.
- **`pages.spec.ts`** – Main pages (Employees, Attendance, Leave, Payroll, Recruitment, Helpdesk, Reports, Admin Roles/Audit, Training, Benefits); ESS for employee.
- **`pages-extra.spec.ts`** – Add Employee, Org Chart, Onboarding, Shifts, Holidays, Salary Structures, Payslips, Performance, Profile, Admin Notifications/Users, Job detail, Onboarding detail.
- **`flows.spec.ts`** – Leave Apply tab, Attendance check-in, Helpdesk raise ticket, Recruitment→candidates, Employee detail tabs, Sidebar nav, User menu logout.
- **`flows-extra.spec.ts`** – Performance tabs, Manager leave tabs, Payroll summary, Admin roles UI, Notifications bell, Profile in menu.

See **`COVERAGE.md`** for a full route × test matrix.

## Requirements

- Dev server runs on `http://localhost:3000` (or set `PLAYWRIGHT_BASE_URL`).
- If not set, `webServer` in `playwright.config.ts` will start `npm run dev` automatically.

## Credentials (demo)

- **HR:** admin@hrms.com / admin123  
- **Manager:** manager@hrms.com / mgr123  
- **Employee:** emp@hrms.com / emp123  
