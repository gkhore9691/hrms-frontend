import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusMap: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  Inactive: "bg-red-100 text-red-700 border-0 hover:bg-red-100",
  Pending: "bg-amber-100 text-amber-700 border-0 hover:bg-amber-100",
  Approved: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  Rejected: "bg-red-100 text-red-700 border-0 hover:bg-red-100",
  Processed: "bg-blue-100 text-blue-700 border-0 hover:bg-blue-100",
  Draft: "bg-slate-100 text-slate-600 border-0 hover:bg-slate-100",
  Processing: "bg-amber-100 text-amber-700 border-0 hover:bg-amber-100",
  Open: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  Closed: "bg-slate-100 text-slate-500 border-0 hover:bg-slate-100",
  "On Hold": "bg-amber-100 text-amber-700 border-0 hover:bg-amber-100",
  "In Progress": "bg-blue-100 text-blue-700 border-0 hover:bg-blue-100",
  Resolved: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  Done: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  Verified: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  Applied: "bg-slate-100 text-slate-600 border-0 hover:bg-slate-100",
  Screened: "bg-blue-100 text-blue-700 border-0 hover:bg-blue-100",
  "Interview Scheduled": "bg-blue-100 text-blue-700 border-0 hover:bg-blue-100",
  Offered: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  Joined: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  "Completed": "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
  "At Risk": "bg-red-100 text-red-700 border-0 hover:bg-red-100",
  "Self Review Submitted": "bg-blue-100 text-blue-700 border-0 hover:bg-blue-100",
  "Manager Review Submitted": "bg-blue-100 text-blue-700 border-0 hover:bg-blue-100",
  Finalized: "bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variantClass = statusMap[status] ?? "bg-slate-100 text-slate-600 border-0 hover:bg-slate-100";
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", variantClass, className)}
    >
      {status}
    </Badge>
  );
}
