# E2E UI Coverage

Every route and major UI flow is covered by at least one E2E test.

## Routes (28 pages)

| Route | Role(s) | Test file | Test name / note |
|-------|---------|-----------|------------------|
| `/login` | Public | auth.spec | Login form, invalid creds, quick logins, redirect |
| `/dashboard` | All | dashboard.spec | HR / Manager / Employee dashboard loads |
| `/employees` | HR, Manager | pages.spec | Employees list loads |
| `/employees/add` | HR | pages-extra.spec | Add Employee page loads |
| `/employees/[id]` | HR, Manager, Self | flows.spec | Employee detail + tabs |
| `/employees/org-chart` | HR, Manager | pages-extra.spec | Org Chart page loads |
| `/recruitment` | HR, Manager | pages.spec, flows.spec | List + link to candidates |
| `/recruitment/[jobId]` | HR, Manager | pages-extra.spec | Job detail from list |
| `/recruitment/[jobId]/candidates` | HR, Manager | flows.spec | Candidates Kanban |
| `/onboarding` | HR, Manager | pages-extra.spec | Onboarding list + detail |
| `/onboarding/[id]` | HR, Manager | pages-extra.spec | Checklist from list click |
| `/attendance` | All | pages.spec, flows.spec | Page + check-in/status |
| `/attendance/shifts` | HR | pages-extra.spec | Shift Management |
| `/leave` | All | pages.spec, flows.spec, flows-extra | Page + Apply tab, Team/My (Manager) |
| `/leave/holidays` | All | pages-extra.spec | Holiday calendar |
| `/payroll` | HR | pages.spec, flows-extra | Page + run/summary |
| `/payroll/salary-structures` | HR | pages-extra.spec | Salary structures |
| `/payroll/payslips` | HR, Employee | pages-extra.spec | Payslips page |
| `/performance` | All | pages-extra.spec, flows-extra | Page + Goals/Reviews tab |
| `/helpdesk` | All | pages.spec, flows.spec | Page + raise ticket dialog |
| `/reports` | HR, Manager | pages.spec | Reports page |
| `/ess` | Employee | pages.spec | ESS loads; redirect when not employee |
| `/training` | All | pages.spec | Training page |
| `/benefits` | HR, Employee | pages.spec | Benefits page |
| `/profile` | All | pages-extra.spec, flows-extra | Profile + menu link |
| `/admin/roles` | HR | pages.spec, flows-extra | Roles + Edit/Create |
| `/admin/audit-logs` | HR | pages.spec | Audit Logs |
| `/admin/notifications` | HR | pages-extra.spec | Notification Setup |
| `/admin/users` | HR | pages-extra.spec | User Management |

## Flows and interactions

| Flow | Test file | What’s tested |
|------|-----------|----------------|
| Login (all 3 roles + invalid) | auth.spec | Form, quick login, redirect |
| Unauthenticated → login | auth.spec | Dashboard redirects to login |
| Sidebar nav (Employees → Leave) | flows.spec | Nav links work |
| User menu (Profile, Logout) | flows.spec, flows-extra | Dropdown + Profile/Logout |
| Notifications bell | flows-extra | Bell visible when logged in |
| Leave: Apply tab + leave types | flows.spec | Tab and content |
| Leave: Team / My (Manager) | flows-extra | Tabs visible |
| Attendance: check-in / status | flows.spec | Button or today status |
| Helpdesk: raise ticket + category | flows.spec | Dialog and options |
| Recruitment: list → job → candidates | flows.spec, pages-extra | Links and URLs |
| Employee list → detail tabs | flows.spec | Row click, tabs |
| Payroll: run/summary | flows-extra | Text visible |
| Performance: Goals/Reviews | flows-extra | Tabs visible |
| Admin: Roles table / Edit | flows-extra | Buttons or text |
| Onboarding: list → detail | pages-extra | Row click, checklist |

## Test files

| File | Purpose |
|------|---------|
| **auth.spec.ts** | Login, credentials, redirect |
| **dashboard.spec.ts** | Dashboard per role |
| **pages.spec.ts** | Main routes (HR + Employee ESS) |
| **pages-extra.spec.ts** | Remaining routes (add, org-chart, onboarding, shifts, holidays, payslips, performance, profile, admin/notifications, admin/users, job detail) |
| **flows.spec.ts** | Leave Apply, Attendance, Helpdesk, Recruitment, Employee detail, Sidebar, User menu |
| **flows-extra.spec.ts** | Performance tabs, Manager leave, Payroll summary, Admin roles UI, Notifications bell, Profile menu |

## Running

```bash
npm run test:e2e
# or
npx playwright test --project=chromium
```

To run only a subset:

```bash
npx playwright test e2e/auth.spec.ts e2e/pages.spec.ts
npx playwright test e2e/pages-extra.spec.ts e2e/flows-extra.spec.ts
```

## Gaps (out of scope or not automated)

- **Multi-step form submission** (e.g. Add Employee all 4 steps, Run Payroll confirm): only “page loads” and first step visibility are tested.
- **Leave approve/reject** from Manager dashboard or Team tab: not automated.
- **Exact table content** (e.g. number of rows): tests only check that main/content is visible.
- **Mobile layout**: viewport is desktop (1280×720); no dedicated mobile E2E.
