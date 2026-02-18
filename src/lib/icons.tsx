import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  Clock,
  CalendarDays,
  Banknote,
  FileText,
  TrendingUp,
  LifeBuoy,
  BarChart2,
  Sparkles,
  Shield,
  Key,
  ScrollText,
  GraduationCap,
  Gift,
  Bell,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  Clock,
  CalendarDays,
  Banknote,
  FileText,
  TrendingUp,
  LifeBuoy,
  BarChart2,
  Sparkles,
  Shield,
  Key,
  ScrollText,
  GraduationCap,
  Gift,
  Bell,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard;
}
