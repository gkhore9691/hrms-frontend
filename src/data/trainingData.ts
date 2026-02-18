export interface TrainingItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  status: "Not Started" | "In Progress" | "Completed";
  dueDate: string;
  completedOn: string | null;
}

export const TRAINING_LIST: TrainingItem[] = [
  { id: "tr1", title: "HRMS System Overview", category: "Orientation", duration: "1h", status: "Completed", dueDate: "2025-01-15", completedOn: "2025-01-10" },
  { id: "tr2", title: "Code of Conduct", category: "Compliance", duration: "30m", status: "Completed", dueDate: "2025-01-20", completedOn: "2025-01-18" },
  { id: "tr3", title: "Information Security Basics", category: "IT", duration: "45m", status: "In Progress", dueDate: "2025-02-28", completedOn: null },
  { id: "tr4", title: "Performance Management", category: "Skills", duration: "2h", status: "Not Started", dueDate: "2025-03-15", completedOn: null },
  { id: "tr5", title: "Leave & Attendance Policy", category: "HR", duration: "20m", status: "Completed", dueDate: "2025-01-25", completedOn: "2025-01-22" },
];
