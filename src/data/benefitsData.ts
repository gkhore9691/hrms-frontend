export interface Benefit {
  id: string;
  name: string;
  category: string;
  description: string;
  eligibility: string;
}

export const BENEFITS_LIST: Benefit[] = [
  { id: "b1", name: "Health Insurance", category: "Insurance", description: "Group health cover for self and dependents.", eligibility: "All full-time employees" },
  { id: "b2", name: "PF & Gratuity", category: "Retirement", description: "Statutory PF and gratuity as per policy.", eligibility: "All employees" },
  { id: "b3", name: "Leave Travel Allowance", category: "Travel", description: "LTA for annual vacation as per policy.", eligibility: "Full-time, 1+ year" },
  { id: "b4", name: "Gym Reimbursement", category: "Wellness", description: "Monthly reimbursement for gym membership.", eligibility: "All employees" },
  { id: "b5", name: "Learning Budget", category: "Development", description: "Annual budget for courses and certifications.", eligibility: "All full-time" },
];
