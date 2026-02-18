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
- **`pages.spec.ts`** – Key pages load (Employees, Attendance, Leave, Payroll, Recruitment, Helpdesk, Reports, Admin, Training, Benefits); ESS for employee.
- **`flows.spec.ts`** – Leave tab, Attendance check-in, Helpdesk raise ticket, Recruitment, Employee detail, Sidebar nav, User menu logout.

## Requirements

- Dev server runs on `http://localhost:3000` (or set `PLAYWRIGHT_BASE_URL`).
- If not set, `webServer` in `playwright.config.ts` will start `npm run dev` automatically.

## Credentials (demo)

- **HR:** admin@hrms.com / admin123  
- **Manager:** manager@hrms.com / mgr123  
- **Employee:** emp@hrms.com / emp123  
