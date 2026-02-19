// Employment & location options for forms and filters
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"] as const;

export const WORK_LOCATIONS = [
  "Bengaluru HQ",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Remote",
  "Hybrid",
] as const;

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

// Leave request statuses
export const LEAVE_REQUEST_STATUSES = ["Pending", "Approved", "Rejected"] as const;

// Ticket statuses and priorities
export const TICKET_STATUSES = ["Open", "In Progress", "Resolved", "Closed"] as const;
export const TICKET_PRIORITIES = ["High", "Medium", "Low"] as const;
export const TICKET_CATEGORIES = ["Payroll", "Leave", "Attendance", "IT", "Reimbursement", "Other"] as const;

// Job statuses
export const JOB_STATUSES = ["Open", "Closed", "On Hold"] as const;

// Candidate pipeline statuses
export const CANDIDATE_STATUSES = [
  "Applied",
  "Screened",
  "Interview Scheduled",
  "Offered",
  "Joined",
  "Rejected",
] as const;

// Employee status
export const EMPLOYEE_STATUSES = ["Active", "Inactive"] as const;

// Salary bands (for display / reference)
export const SALARY_BANDS: {
  id: string;
  name: string;
  minCTC: number;
  maxCTC: number;
  description: string;
  employeeCount: number;
}[] = [
  { id: "sb1", name: "Fresher", minCTC: 400000, maxCTC: 600000, description: "0–1 years experience", employeeCount: 4 },
  { id: "sb2", name: "Junior", minCTC: 600000, maxCTC: 1200000, description: "1–3 years experience", employeeCount: 8 },
  { id: "sb3", name: "Senior", minCTC: 1200000, maxCTC: 2000000, description: "3–7 years experience", employeeCount: 7 },
  { id: "sb4", name: "Manager", minCTC: 2000000, maxCTC: 3000000, description: "7+ years, people manager", employeeCount: 3 },
];
