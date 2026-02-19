# PeopleOS HRMS — Features Achieved (Frontend)

Detailed document of all features implemented in this HRMS frontend application.

---

## 1. Product Overview

| Item | Description |
|------|-------------|
| **Product name** | PeopleOS HRMS |
| **Stack** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Hook Form + Zod, Recharts, Framer Motion, Lucide icons |
| **Roles** | **HR Admin**, **Manager**, **Employee** — with distinct permissions and navigation |
| **Data** | Client-only; Zustand stores persisted to `localStorage`. No backend; all data is dummy/seed data. |
| **Design** | Enterprise-style UI: dark navy sidebar (#0F172A), white content, primary blue (#2563EB), Sora (headings) + DM Sans (body) |

---

## 2. Authentication & Access

### 2.1 Login
- **Route:** `/login`
- **Features:**
  - Split layout: branded left panel (PeopleOS, tagline), right login form
  - Email + password with show/hide password toggle
  - “Remember me” checkbox
  - **Quick login (demo):** one-click login as HR Admin, Manager, or Employee with pre-filled credentials
  - Validation via Zod; invalid credentials show inline error (“Invalid email or password”), no `alert()`
- **Session:** Stored in Zustand (`authStore`) and persisted to `localStorage`. Session holds `userId`, `role`, `name`, `employeeId`.

### 2.2 Role-Based Access
- **Navigation:** Sidebar and nav items filtered by `session.role` using `NAV_CONFIG` in `lib/permissions.ts`. HR sees all modules including Admin; Manager sees team-related items; Employee sees Attendance, Leave, Payslips, Performance, Helpdesk, ESS, Training, Benefits.
- **Page guards:** HR-only pages (e.g. `/payroll`, `/employees/add`, `/admin/*`) redirect non-HR users to `/dashboard`. ESS (`/ess`) is employee-only; others are redirected to dashboard.
- **Component guards:** `<RoleGuard permission="...">` used to hide buttons/sections (e.g. Add Employee, Edit salary, Run Payroll) from users without the permission.
- **Permission matrix:** `lib/permissions.ts` defines `PERMISSION_MAP` for `hr`, `manager`, `employee` with granular keys (e.g. `employees.view`, `employees.create`, `leave.approve`, `payroll.run`). Admin Roles page allows editing permissions per role.

### 2.3 User Management (Admin)
- **Route:** `/admin/users` (HR only)
- **Features:**
  - List all users (from `adminStore.users`) with name, email, role, employee ID
  - **Add user:** Dialog with name, email, password, role, employee ID; generates `id` and avatar initials; appends to store and writes audit log
  - **Edit role:** Per-user dialog to change role (HR / Manager / Employee)
- **Auth source:** Login checks `adminStore.users` first (if populated), else falls back to seed `USERS` from dummy data. New users created via User Management are used for login.

---

## 3. Dashboard

- **Route:** `/dashboard`
- **Role-specific views:**
  - **HR:** Stat cards (Total Employees, Present Today, Open Positions, Pending Leaves), headcount trend chart, department donut, pending leave approvals table with Approve/Reject, birthdays/anniversaries, monthly attendance bar chart, quick actions (Add Employee, Run Payroll, Post Job, Generate Report)
  - **Manager:** Team attendance today (avatars + status), pending approvals (leave), team goals summary, team list with status
  - **Employee:** Check-in card (live clock, Check-in/Check-out, hours worked today), attendance calendar (month view, colour by status), leave balance cards (AL/SL/CL), next holidays, latest payslip link
- **Data:** All from Zustand stores and dummy data; no API calls.

---

## 4. Employee Management

### 4.1 Employee List
- **Route:** `/employees`
- **Features:**
  - Table: Employee (avatar + name + ID), Department, Designation, Date of Joining, Work Location, Status (Active/Inactive), Actions (View, Edit for HR)
  - Search (name/ID/email), filters: Department, Status, Employment Type
  - **Add Employee** button (HR only) → `/employees/add`
- **Access:** HR sees all; Manager sees only their team (`employeeStore.getTeam(managerId)`); Employee can view directory (no salary/bank).

### 4.2 Add Employee
- **Route:** `/employees/add` (HR only)
- **Features:**
  - Multi-step form (4 steps with step indicator): **1. Personal Info** (name, DOB, gender, blood group, phone, email, address), **2. Job Details** (department, designation, reporting manager, DOJ, work location, shift, employment type), **3. Documents** (Aadhaar, PAN, Offer Letter upload placeholders), **4. Salary & Bank** (CTC, auto-calculated breakdown, bank name, account no, IFSC)
  - Validation per step (Zod); on submit: `employeeStore.addEmployee()`, auto-generated EMP ID (e.g. EMP021), audit log, toast, redirect to employee detail

### 4.3 Employee Detail
- **Route:** `/employees/[id]`
- **Tabs:**
  - **Overview:** Hero card (avatar, name, designation, department, status), tenure, attendance %, leave balance, reporting manager (link), direct reports, skills, emergency contact
  - **Personal:** All personal fields; Edit (HR or self) with inline save
  - **Job & Salary:** Job details; salary breakdown table (RoleGuard for payroll view)
  - **Documents:** List of documents (icon, name, date, status); Upload (HR); **Download** per document (simulated client-side download)
  - **Attendance:** Month selector, calendar view (colour by status), summary counts
  - **Leave:** Balance cards, leave history table
  - **Performance:** Goals with progress, review status
- **Deactivate:** HR can deactivate employee (status → Inactive) from store.

### 4.4 Org Chart
- **Route:** `/employees/org-chart`
- **Features:** Tree built from `reportingManagerId`; nodes show avatar, name, designation; click → employee profile; expand/collapse.

---

## 5. Recruitment

### 5.1 Jobs List
- **Route:** `/recruitment`
- **Features:** Card grid of jobs (title, department, location, experience, salary, posted date, applicant count, status); filters (Status, Department); **Post New Job** (HR) — dialog with title, department, location, type, experience, salary range, requirements (tags), description, closing date. Jobs and applicants from `recruitmentStore`.

### 5.2 Job Detail
- **Route:** `/recruitment/[jobId]`
- **Features:** Full job description, requirements, applicant funnel stats; **View Candidates** link; **Apply for this job** form (name, email, phone, experience, resume URL) — creates candidate in “Applied” via `recruitmentStore.addCandidate()` (internal ATS apply).

### 5.3 Candidates (Kanban)
- **Route:** `/recruitment/[jobId]/candidates`
- **Features:**
  - Kanban columns: Applied → Screened → Interview Scheduled → Offered → Joined | Rejected
  - Card: name, experience, company, expected CTC, days since applied; actions: Move stage, Schedule Interview, Reject, View Resume
  - **Schedule Interview:** Dialog (round, type, interviewer, date/time, notes) → `scheduleInterview()`; notification to interviewer
  - **Interview Feedback:** Form (rating, strengths, weaknesses, hire recommendation) → `submitFeedback()`
  - **Send Offer:** Dialog (CTC, joining date, designation) → `sendOffer()` (status → Offered)
- **Data:** Candidates, interviews, feedback stored in `recruitmentStore`; audit logs and notifications on key actions.

---

## 6. Onboarding

### 6.1 Onboarding List
- **Route:** `/onboarding`
- **Features:** Table of checklists (employee, department, start date, progress bar %, status); **View** link to `/onboarding/[id]`. For employee role: “My Onboarding” link when they have a checklist.

### 6.2 Onboarding Detail
- **Route:** `/onboarding/[id]`
- **Features:** Employee header; progress ring (% complete); tasks grouped by category (HR, IT, Finance, Admin, Compliance); each task: status, due date, overdue highlight, complete checkbox (employee can mark done); Policy acceptance task with “I Accept” flow; **Add task** (HR). Data from `onboardingStore`; `completeTask()` updates progress and audit.

---

## 7. Attendance

### 7.1 Attendance Page
- **Route:** `/attendance`
- **Employee view:**
  - **Today’s card:** Live clock; Check-in / Check-out buttons; hours worked so far; status (no record / checked in / full record)
  - **Calendar:** Month view, cells coloured by status (Present, Absent, Late, On Leave, Holiday, Weekend)
  - Summary: Present / Absent / Late / Leave / OT counts
- **Manager view:** Team attendance table for today; date picker; pending regularization requests with Approve/Reject
- **HR view:** Department + date range filters; full attendance table; regularization requests table; Export (simulated)
- **Store:** `attendanceStore`: `checkIn(employeeId)`, `checkOut(employeeId, date)`, `getTodayStatus()`, `getMonthly()`, `getTeamToday()`, regularization request/approve; audit logs on actions.

### 7.2 Shift Management
- **Route:** `/attendance/shifts` (HR only)
- **Features:** Shift definitions table (name, start, end, break); employee–shift assignments table; **Assign Shift** dialog (employee, shift, effective from). Uses `shiftStore` and employee `shiftId`.

---

## 8. Leave Management

### 8.1 Leave Page
- **Route:** `/leave`
- **Tabs:**
  - **Apply Leave:** Leave type selector (with balance), from/to dates, working days calc, reason; submit → `leaveStore.applyLeave()`; notification to manager
  - **My Leaves:** Balance cards (per type, used/total, ring); history table with Cancel (if Pending)
  - **Team Leaves** (Manager/HR): Pending approvals with Approve/Reject; team leave calendar
  - **Leave Policies** (HR): Table of leave types; edit (total days, carry forward, etc.)
- **Approve/Reject:** Approve decrements balance, notifies employee; Reject notifies employee with optional reason. All via `leaveStore`; audit logs and notifications.

### 8.2 Holiday Calendar
- **Route:** `/leave/holidays`
- **Features:** Year view; list of holidays (date, name, type); HR can add/edit holidays. Data in `leaveStore` or dedicated `holidayStore` (if used).

---

## 9. Payroll

### 9.1 Payroll Page
- **Route:** `/payroll` (HR only)
- **Features:** Month selector; status (Draft / Processing / Processed); summary cards (Gross, Deductions, Net, Employee count); **Run Payroll** (only if Draft) with confirmation dialog; on confirm: simulated processing (e.g. 1.5s) then status → Processed, payslips generated for all active employees; notifications to all users; audit log. Payroll summary table with link to payslip.

### 9.2 Salary Structures
- **Route:** `/payroll/salary-structures`
- **Features:** Employee–salary table; **Edit Salary** (Sheet): CTC input, live breakdown (Basic, HRA, allowances, PF, tax); save → `employeeStore.updateEmployee()` with new salary.

### 9.3 Payslips
- **Route:** `/payroll/payslips`
- **Features:** HR: all employees, month filter, table with View. Employee: own payslips only. **Payslip view** (Dialog): company header, pay period, employee info, working days / present / LOP, earnings (Basic, HRA, Transport, Medical, Special), deductions (PF, ESIC, PT, TDS), gross, total deductions, net salary; **Print / Download** via `window.print()` (print CSS scoped to payslip content).

### 9.4 Reimbursements (UC 41)
- Reimbursement requests handled as **Helpdesk** tickets with category “Reimbursement.” On ticket detail, HR can **Mark as paid in payroll** (`helpdeskStore.markPaidInPayroll(ticketId)`); ticket shows “Paid in payroll” when set. Field `paidInPayroll` on `HelpdeskTicket`.

---

## 10. Performance Management

- **Route:** `/performance`
- **Tabs:**
  - **Goals:** HR/Manager: Set goal (employee, title, category, description, target, deadline, weightage); table of goals with progress bar. Employee: My goals cards with progress
  - **Reviews:** Active cycle banner; Employee: self-review (rating + comments per goal, submit); Manager: pending self-reviews, manager rating + comments, submit; HR: finalize rating
  - **Cycles** (HR only): List of cycles; Create cycle (name, type, start/end dates)
- **Store:** `performanceStore`: cycles, goals, reviews; `addGoal`, `submitSelfReview`, `submitManagerReview`, `finalizeRating`; audit logs.

---

## 11. Helpdesk

- **Route:** `/helpdesk`
- **Features:**
  - **Raise ticket** (Employee/any): Dialog — Category (Payroll, Leave, Attendance, IT, **Reimbursement**, Other), Subject, Description, Priority; submit → `helpdeskStore.raiseTicket()`; TKT-XXX auto-increment; notification to HR
  - **List:** Filters (status, category, assignee, priority); table with ticket no, subject, category, priority, status, raised on; HR sees Assign
  - **Detail (Sheet/Dialog):** Subject, description, status; comment thread; reply box; HR: Assign dropdown, Resolve/Reopen; for Reimbursement: **Mark as paid in payroll** and “Paid in payroll” badge
- **Store:** `helpdeskStore`: `raiseTicket`, `assignTicket`, `addComment`, `updateStatus`, `resolveTicket`, `reopenTicket`, `markPaidInPayroll`; audit and notifications (new ticket → HR, assign → assignee).

---

## 12. Reports

- **Route:** `/reports` (HR + Manager; Manager sees team only)
- **Tabs:** Attendance (day-wise chart, table); Payroll (month-wise gross/net, table); Headcount (department donut, trend, table); Leave (usage, balance table); Attrition (exits, voluntary/involuntary). Date/department filters; **Export CSV** (simulated toast). Data from stores and dummy data.

---

## 13. Employee Self-Service (ESS)

- **Route:** `/ess` (Employee only)
- **Features:** Grid of tiles: Apply Leave, View Payslip, Update Profile, Attendance, Raise Ticket, My Goals, Announcements, Org Chart, **Training**, **Benefits**. Each links to the corresponding page or section. **Announcements** section: list of company announcements (from `data/announcements.ts`). Redirect to `/dashboard` if non-employee visits `/ess`.

---

## 14. Training & Benefits

### 14.1 Training
- **Route:** `/training`
- **Features:** Table of training items (from `data/trainingData.ts`: name, type, duration, status, due date); status filter. In nav and ESS for relevant roles.

### 14.2 Benefits
- **Route:** `/benefits`
- **Features:** Cards of benefits (from `data/benefitsData.ts`: name, description, eligibility, type). In nav and ESS.

---

## 15. Profile

- **Route:** `/profile`
- **Features:** Redirect to own employee detail `/employees/[session.employeeId]` or dedicated profile view (edit name, phone, address). Topbar user menu includes **Profile** link.

---

## 16. Admin

### 16.1 Roles & Permissions
- **Route:** `/admin/roles` (HR only)
- **Features:** Roles table (name, description, user count); **Create role** (name, description, copy permissions from existing); **Edit role** (Sheet): permission matrix (modules × permissions) with checkboxes — human-readable labels via `formatPermissionLabel()` (e.g. “Attendance → Check In”); **Users** tab for built-in roles: “Assign user to this role” and list of users in role. Permissions drive `canAccess()` and nav visibility.

### 16.2 Audit Logs
- **Route:** `/admin/audit-logs` (HR only)
- **Features:** Filters (module, action, date range, performed by); table: Timestamp, Module, Action, **Performed By** (resolved to user name via adminStore + employeeStore), Target, Details. Read-only; entries added by all stores on mutations.

### 16.3 Notification Setup
- **Route:** `/admin/notifications` (HR only)
- **Features:** Send test notification: select user, title, message; submit → `notificationStore.addNotification()`. Used to test Topbar bell and popover.

### 16.4 User Management
- Described in **§ 2.3**.

---

## 17. Notifications

- **Topbar bell:** Unread count badge; click opens **Popover** with list of notifications for current user (from `notificationStore`). Each item: title, message, time; mark read on click; “Mark all read” button. Notifications persisted in `notificationStore` (localStorage).
- **Triggers (automatic):**
  - Leave applied → notify manager
  - Leave approved / rejected → notify employee
  - Payroll processed → notify all users
  - Ticket raised → notify HR
  - Ticket assigned → notify assignee
  - Interview scheduled → notify interviewer
- **Helper:** `adminStore.getUserIdByEmployeeId(employeeId)` used by stores to resolve user ID for notifications.

---

## 18. UI/UX & Technical

### 18.1 Layout
- **App shell:** Sidebar (260px, dark, fixed) + Topbar (sticky, white, page title + notifications bell + user dropdown) + main content. **Mobile:** Hamburger opens Sheet (MobileSidebar) with same nav. **Tablet:** Sidebar can collapse to icon-only (if implemented).
- **Page header:** `PageHeader` component (title, optional description, optional action button) used across pages.

### 18.2 Components
- **shadcn/ui:** Button, Badge, Card, Dialog, Sheet, Table, Tabs, Input, Select, Checkbox, Avatar, Calendar, Popover, Progress, ScrollArea, AlertDialog, DropdownMenu, Form (RHF), Sonner toasts, etc.
- **Custom:** `UserAvatar` (initials + colour), `StatusBadge` (semantic colours), `EmptyState`, `ConfirmDialog`, `DataTable` (search, pagination, empty state), `PageHeader`, `RoleGuard`, chart wrappers (Bar, Line, Donut, StatCard).

### 18.3 Forms & Validation
- React Hook Form + Zod (`zodResolver`); errors via `<FormMessage>`; no `alert()`. Multi-step forms validate step before “Next.”

### 18.4 State (Zustand)
- **Stores:** `authStore`, `employeeStore`, `leaveStore`, `attendanceStore`, `payrollStore`, `recruitmentStore`, `onboardingStore`, `performanceStore`, `helpdeskStore`, `adminStore`, `notificationStore`, `shiftStore`, `holidayStore` (if present). All use `persist` with `localStorage` so data survives refresh.
- **Cross-store:** Mutations call `adminStore.addAuditLog()`; many call `notificationStore.addNotification()` for relevant users.

### 18.5 Data
- **Seed data:** `src/data/dummyData.ts` — USERS, DEPARTMENTS, DESIGNATIONS, EMPLOYEES, LEAVE_*, HOLIDAYS, SHIFTS, ATTENDANCE_RECORDS, PAYROLL_*, JOB_OPENINGS, CANDIDATES, ONBOARDING_*, PERFORMANCE_*, GOALS, REVIEWS, HELPDESK_TICKETS, ROLES, AUDIT_LOGS. Plus `announcements.ts`, `trainingData.ts`, `benefitsData.ts`.
- **Types:** All in `src/types/index.ts` (User, Session, Employee, Leave*, Attendance*, Payroll*, Recruitment*, Onboarding*, Performance*, Helpdesk*, Admin, Notification, etc.).

### 18.6 Formatting & i18n
- **Currency:** `formatCurrency()` (e.g. ₹1,00,000) used across payslips and salary.
- **Dates:** `formatDate()`, `formatDateTime()`, `formatMonth()`, `timeAgo()` from `lib/formatters.ts` (date-fns). No raw ISO in UI.

### 18.7 E2E Testing
- **Playwright** in `e2e/`: auth, dashboard, pages, pages-extra, flows, flows-extra. Covers all 28 routes and main interactions. See `e2e/COVERAGE.md` for route × test matrix.

---

## 19. Out of Scope / Limitations

- **Backend:** None; all state is client-side and persisted to localStorage.
- **Biometric / Geo:** No device integration; no biometric sync or geo-fenced attendance.
- **Native mobile app:** Responsive web only; no dedicated native app.
- **Public career page:** Apply for job is internal ATS only (job detail page form).
- **Offer letter PDF:** “Send offer” updates status only; no PDF generation.
- **Email templates / backup-restore:** Not implemented.
- **OTP / verify flow:** Login is email+password only; no OTP or separate “Human” user-creation flow.
- **Full 360 feedback:** Cycle type exists; self + manager reviews only (no peer/customer).
- **P3 (AI, sentiment, attrition prediction):** Not in scope.

---

## 20. Summary Table

| Module | Key features achieved |
|--------|------------------------|
| **Auth** | Login, 3 roles, quick login, user management (add/edit role), RBAC, permission matrix |
| **Dashboard** | Role-specific: HR stats/charts/approvals, Manager team/approvals, Employee check-in/balance/payslip |
| **Employees** | List, add (4-step), detail (tabs), org chart, documents upload/download, deactivate |
| **Recruitment** | Jobs CRUD, job detail, apply form, candidates Kanban, schedule interview, feedback, offer |
| **Onboarding** | Checklist list/detail, tasks by category, complete task, policy accept |
| **Attendance** | Check-in/out, calendar, team view, regularization, shift management |
| **Leave** | Apply, my/team leaves, approve/reject, policies, holidays |
| **Payroll** | Run payroll, salary structures, payslips, print; reimbursement via helpdesk + mark paid |
| **Performance** | Goals, self/manager review, cycles, finalize rating |
| **Helpdesk** | Raise ticket, categories (incl. Reimbursement), assign, comment, resolve, mark paid in payroll |
| **Reports** | Attendance, Payroll, Headcount, Leave, Attrition tabs, export (simulated) |
| **ESS** | Tiles (leave, payslip, profile, attendance, ticket, goals, announcements, org chart, training, benefits) |
| **Training / Benefits** | Dedicated pages + data + nav/ESS |
| **Admin** | Roles + permissions + assign users, audit logs, notification setup, user management |
| **Notifications** | Bell, popover, mark read, triggers on leave/payroll/ticket/interview |

This document reflects the frontend as implemented; for use-case-level mapping see `docs/HRMS-Features-Coverage.md`, and for E2E coverage see `e2e/COVERAGE.md`.
