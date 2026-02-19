import type { UserRole } from "@/types";

export const PERMISSION_MAP: Record<string, Record<string, boolean | string>> = {
  hr: {
    "employees.view": "full",
    "employees.create": true,
    "employees.edit": true,
    "employees.delete": true,
    "recruitment.view": true,
    "recruitment.create": true,
    "recruitment.manage": true,
    "recruitment.offer": true,
    "onboarding.assign": true,
    "onboarding.monitor": true,
    "attendance.view": "full",
    "attendance.regularize": true,
    "attendance.configure": true,
    "leave.apply": true,
    "leave.approve": true,
    "leave.configure": true,
    "payroll.run": true,
    "payroll.view": "full",
    "payroll.editSalary": true,
    "performance.view": "full",
    "performance.setGoals": true,
    "performance.finalizeRating": true,
    "reports.view": "full",
    "helpdesk.manage": true,
    "admin.userSetup": true,
    "admin.auditLogs": true,
  },
  manager: {
    "employees.view": "team",
    "recruitment.view": true,
    "recruitment.interviewFeedback": true,
    "onboarding.monitor": true,
    "attendance.view": "team",
    "attendance.regularize": "approve",
    "leave.apply": true,
    "leave.approve": "team",
    "payroll.view": false,
    "performance.view": "team",
    "performance.setGoals": "team",
    "performance.submitReview": "team",
    "reports.view": "team",
    "helpdesk.view": "team",
    "admin.userSetup": false,
    "admin.auditLogs": false,
  },
  employee: {
    "employees.view": "directory",
    "attendance.view": "self",
    "attendance.checkIn": true,
    "attendance.regularize": "request",
    "leave.apply": true,
    "leave.balance": true,
    "payroll.view": "self",
    "performance.view": "self",
    "performance.selfReview": true,
    "helpdesk.create": true,
    "admin.userSetup": false,
    "admin.auditLogs": false,
  },
};

/** All unique permission keys used in the matrix (from all roles). */
export const ALL_PERMISSION_KEYS: string[] = [
  ...new Set(
    Object.values(PERMISSION_MAP).flatMap((r) => Object.keys(r))
  ),
].sort();

/**
 * Converts a permission key to a human-readable label.
 * e.g. "attendance.checkIn" → "Attendance → Check In"
 */
export function formatPermissionLabel(key: string): string {
  const dot = key.indexOf(".");
  const module = dot === -1 ? key : key.slice(0, dot);
  const permission = dot === -1 ? "" : key.slice(dot + 1);

  const formatModule = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const camelToTitle = (s: string) =>
    s
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();

  const moduleLabel = formatModule(module);
  const permissionLabel = permission ? camelToTitle(permission) : moduleLabel;
  return permission ? `${moduleLabel} → ${permissionLabel}` : moduleLabel;
}

export function can(role: UserRole, permission: string): boolean | string {
  return PERMISSION_MAP[role]?.[permission] ?? false;
}

export function canAccess(role: UserRole, permission: string): boolean {
  const result = can(role, permission);
  return result !== false;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  children?: { label: string; href: string; icon: string }[];
}

export const NAV_CONFIG: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["hr", "manager", "employee"],
  },
  {
    label: "Employees",
    href: "/employees",
    icon: "Users",
    roles: ["hr", "manager"],
  },
  {
    label: "Recruitment",
    href: "/recruitment",
    icon: "Briefcase",
    roles: ["hr", "manager"],
  },
  {
    label: "Onboarding",
    href: "/onboarding",
    icon: "UserCheck",
    roles: ["hr", "manager"],
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: "Clock",
    roles: ["hr", "manager", "employee"],
  },
  {
    label: "Leave",
    href: "/leave",
    icon: "CalendarDays",
    roles: ["hr", "manager", "employee"],
  },
  {
    label: "Payroll",
    href: "/payroll",
    icon: "Banknote",
    roles: ["hr"],
  },
  {
    label: "Payslips",
    href: "/payroll/payslips",
    icon: "FileText",
    roles: ["hr", "employee"],
  },
  {
    label: "Performance",
    href: "/performance",
    icon: "TrendingUp",
    roles: ["hr", "manager", "employee"],
  },
  {
    label: "Helpdesk",
    href: "/helpdesk",
    icon: "LifeBuoy",
    roles: ["hr", "manager", "employee"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "BarChart2",
    roles: ["hr", "manager"],
  },
  {
    label: "Self Service",
    href: "/ess",
    icon: "Sparkles",
    roles: ["employee"],
  },
  {
    label: "Admin",
    href: "/admin/roles",
    icon: "Shield",
    roles: ["hr"],
    children: [
      { label: "Roles & Permissions", href: "/admin/roles", icon: "Key" },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: "ScrollText" },
    ],
  },
];
