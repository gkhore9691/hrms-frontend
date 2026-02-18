"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileText,
  User,
  Clock,
  LifeBuoy,
  Target,
  Megaphone,
  Network,
  Gift,
  GraduationCap,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANNOUNCEMENTS } from "@/data/announcements";
import { formatDate } from "@/lib/formatters";

const TILES = [
  {
    label: "Apply Leave",
    description: "Submit and track leave requests",
    href: "/leave",
    icon: CalendarDays,
  },
  {
    label: "View Payslip",
    description: "Download and view your payslips",
    href: "/payroll/payslips",
    icon: FileText,
  },
  {
    label: "Update Profile",
    description: "Edit your personal and contact details",
    href: "/profile",
    icon: User,
  },
  {
    label: "Attendance",
    description: "Check in, check out, and view records",
    href: "/attendance",
    icon: Clock,
  },
  {
    label: "Raise Ticket",
    description: "Create and track helpdesk tickets",
    href: "/helpdesk",
    icon: LifeBuoy,
  },
  {
    label: "My Goals",
    description: "View and update your performance goals",
    href: "/performance",
    icon: Target,
  },
  {
    label: "Announcements",
    description: "Company news and updates",
    href: "#announcements",
    icon: Megaphone,
  },
  {
    label: "Org Chart",
    description: "View company organization structure",
    href: "/employees/org-chart",
    icon: Network,
  },
  {
    label: "Training",
    description: "View and track your training courses",
    href: "/training",
    icon: GraduationCap,
  },
  {
    label: "Benefits",
    description: "Company benefits and eligibility",
    href: "/benefits",
    icon: Gift,
  },
];

export default function ESSPage() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();

  useEffect(() => {
    if (session && session.role !== "employee") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  if (!session) return null;
  if (session.role !== "employee") return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Self Service"
        description="Quick access to leave, payslips, attendance, and more"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const isAnchor = tile.href.startsWith("#");
          const content = (
            <Card className="h-full rounded-xl shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{tile.label}</CardTitle>
                <p className="mt-1 text-sm text-slate-600">{tile.description}</p>
              </CardHeader>
            </Card>
          );
          return isAnchor ? (
            <a key={tile.label} href={tile.href} className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl">
              {content}
            </a>
          ) : (
            <Link key={tile.label} href={tile.href} className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl">
              {content}
            </Link>
          );
        })}
      </section>

      <section id="announcements" className="scroll-mt-4">
        <h2 className="mb-4 font-display text-xl font-semibold">Announcements</h2>
        <div className="space-y-4">
          {ANNOUNCEMENTS.map((a) => (
            <Card key={a.id} className="rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{a.title}</span>
                  <span className="text-sm font-normal text-slate-500">
                    {formatDate(a.date)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-line">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
