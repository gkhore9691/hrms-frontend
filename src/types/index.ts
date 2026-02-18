// ─── Auth / User ─────────────────────────────────────────────────────────────
export type UserRole = "hr" | "manager" | "employee";

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  avatar: string;
  employeeId: string;
}

export interface Session {
  userId: string;
  role: UserRole;
  name: string;
  employeeId: string;
}

// ─── Employee ────────────────────────────────────────────────────────────────
export interface BankAccount {
  bank: string;
  accountNo: string;
  ifsc: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  uploadedOn: string;
  status: string;
}

export interface SalaryBreakdown {
  ctc: number;
  basic: number;
  hra: number;
  allowances: number;
  pf: number;
  tax: number;
}

export interface Employee {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  photo: string | null;
  gender: string;
  dob: string;
  bloodGroup: string;
  address: string;
  department: string;
  designation: string;
  reportingManagerId: string | null;
  dateOfJoining: string;
  employmentType: string;
  status: "Active" | "Inactive";
  workLocation: string;
  skills: string[];
  bankAccount: BankAccount;
  emergencyContact: EmergencyContact;
  documents: EmployeeDocument[];
  salary: SalaryBreakdown;
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  employeeCount: number;
}

// ─── Leave ───────────────────────────────────────────────────────────────────
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  totalDays: number;
  carryForward: boolean;
  color: string;
}

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  used: number;
  balance: number;
}

export type LeaveRequestStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  appliedOn: string;
  approvedBy: string | null;
  comments: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export interface ShiftAssignment {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
}

export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Half Day"
  | "Late"
  | "On Leave"
  | "Holiday"
  | "Weekend";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  hoursWorked: number;
  overtime: number;
  shiftId: string;
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedOn: string;
  approvedBy: string | null;
}

// ─── Payroll ─────────────────────────────────────────────────────────────────
export type PayrollRunStatus = "Draft" | "Processing" | "Processed";

export interface PayrollRun {
  id: string;
  month: string;
  status: PayrollRunStatus;
  processedOn: string | null;
  processedBy: string | null;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

export interface PayslipEarnings {
  basic: number;
  hra: number;
  transportAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
}

export interface PayslipDeductions {
  pf: number;
  esic: number;
  professionalTax: number;
  tds: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  payrollRunId: string;
  month: string;
  earnings: PayslipEarnings;
  deductions: PayslipDeductions;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  lop: number;
  lopAmount: number;
  generatedOn: string;
}

// ─── Recruitment ──────────────────────────────────────────────────────────────
export type JobStatus = "Open" | "Closed" | "On Hold";

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  status: JobStatus;
  postedOn: string;
  closingDate: string;
  description: string;
  requirements: string[];
  applicantCount: number;
}

export type CandidateStatus =
  | "Applied"
  | "Screened"
  | "Interview Scheduled"
  | "Offered"
  | "Joined"
  | "Rejected";

export interface Interview {
  id: string;
  round: number;
  type: string;
  interviewerId: string;
  scheduledOn: string;
  status: string;
  feedback: string | null;
  rating: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
  hireRecommendation?: "Yes" | "No" | null;
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  currentCTC: string;
  expectedCTC: string;
  currentCompany: string;
  location: string;
  status: CandidateStatus;
  appliedOn: string;
  resumeUrl: string;
  interviews: Interview[];
  notes: string;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export type OnboardingTaskStatus = "Done" | "Pending";

export interface OnboardingTask {
  id: string;
  title: string;
  category: string;
  status: OnboardingTaskStatus;
  dueDate: string;
  completedOn: string | null;
}

export interface OnboardingChecklist {
  id: string;
  employeeId: string;
  assignedOn: string;
  tasks: OnboardingTask[];
}

// ─── Performance ──────────────────────────────────────────────────────────────
export type GoalStatus = "In Progress" | "Completed" | "At Risk";

export interface PerformanceCycle {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  cycleId: string;
  title: string;
  category: string;
  description: string;
  target: string;
  deadline: string;
  weightage: number;
  status: GoalStatus;
  progress: number;
  setBy: string;
  setOn: string;
}

export type ReviewStatus =
  | "Self Review Pending"
  | "Self Review Submitted"
  | "Manager Review Pending"
  | "Manager Review Submitted"
  | "Finalized";

export interface Review {
  id: string;
  employeeId: string;
  cycleId: string;
  selfRating: number | null;
  selfComments: string | null;
  managerRating: number | null;
  managerComments: string | null;
  finalRating: number | null;
  status: ReviewStatus;
  submittedOn: string | null;
}

// ─── Helpdesk ──────────────────────────────────────────────────────────────────
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "High" | "Medium" | "Low";

export interface TicketComment {
  author: string;
  text: string;
  date: string;
}

export interface HelpdeskTicket {
  id: string;
  ticketNo: string;
  raisedBy: string;
  assignedTo: string | null;
  category: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  raisedOn: string;
  dueBy: string | null; // SLA due date
  resolvedOn: string | null;
  comments: TicketComment[];
  paidInPayroll?: boolean; // Reimbursement: marked when added to payroll
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface RolePermissions {
  [key: string]: boolean | string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  usersCount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  performedBy: string;
  target: string;
  timestamp: string;
  details: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
