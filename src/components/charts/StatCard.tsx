import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, trend, icon: Icon, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      </CardHeader>
      <CardContent>
        <p className="font-display text-2xl font-semibold text-slate-900">
          {value}
        </p>
        {trend && (
          <p className="mt-1 text-xs text-slate-500">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
