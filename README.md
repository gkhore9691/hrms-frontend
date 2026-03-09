# PeopleOS HRMS

A production-grade, enterprise Human Resource Management System built with Next.js 15, React 19, and TypeScript. Features full role-based access control across HR Admin, Manager, and Employee roles.

🔗 **Live Demo:** https://hrms-frontend-rust.vercel.app

## ✨ Features

- **Auth & RBAC** — 3 roles (HR Admin, Manager, Employee), permission matrix, page & component guards via `RoleGuard`
- **Dashboard** — Role-specific views: HR stats/charts/approvals, Manager team view, Employee check-in/leave balance
- **Employee Management** — 4-step onboarding form, org chart, document upload/download, deactivate
- **Recruitment** — Jobs CRUD, Kanban pipeline (Applied → Screened → Interview → Offered → Joined), interview scheduling, offer management
- **Attendance** — Check-in/out, calendar view, shift management, regularization requests
- **Leave Management** — Apply, approve/reject, policies, holiday calendar, team leave view
- **Payroll** — Run payroll, salary structures, payslip generation with print/download
- **Performance** — Goals, self + manager reviews, review cycles, finalize ratings
- **Helpdesk** — Ticket system with categories, assignment, comments, reimbursement flow
- **Reports** — Attendance, Payroll, Headcount, Leave, Attrition with export
- **Admin** — Roles & permissions editor, audit logs, user management, notification setup
- **Notifications** — Real-time bell, unread count, auto-triggered on leave/payroll/tickets

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| State | Zustand (13+ stores, persisted to localStorage) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animation | Framer Motion |
| Testing | Playwright E2E (28 routes covered) |

## 🧪 E2E Testing

Full Playwright test coverage across all 28 routes including auth flows, RBAC guards, leave approval, payroll processing, and recruitment pipeline.
```bash
npx playwright test
```

## 🚀 Getting Started
```bash
npm install
npm run dev
```

Open http://localhost:3000 and use the quick login buttons to sign in as HR Admin, Manager, or Employee.

## 📁 Project Structure
```
src/
├── app/          # Next.js App Router pages (28 routes)
├── components/   # Reusable UI components + shadcn/ui
├── stores/       # 13 Zustand stores
├── lib/          # Permissions, formatters, utils
├── types/        # TypeScript interfaces
└── data/         # Seed/dummy data
```
