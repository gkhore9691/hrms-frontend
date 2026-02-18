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
export const SALARY_BANDS = [
  { name: "Fresher", minCtc: 300000, maxCtc: 600000 },
  { name: "Junior", minCtc: 600000, maxCtc: 1200000 },
  { name: "Senior", minCtc: 1200000, maxCtc: 2400000 },
  { name: "Manager", minCtc: 2400000, maxCtc: 5000000 },
] as const;
