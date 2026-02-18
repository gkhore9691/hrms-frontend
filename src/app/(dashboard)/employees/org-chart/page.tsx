"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Building2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/data/dummyData";
import type { Employee } from "@/types";

function OrgNode({ employee, title }: { employee: Employee; title?: string }) {
  return (
    <Link href={`/employees/${employee.id}`} className="block" title={title ?? employee.department}>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md min-w-[140px]">
        <UserAvatar name={employee.name} avatar={employee.photo ?? undefined} className="h-12 w-12" />
        <div className="text-center">
          <p className="font-medium text-slate-900">{employee.name}</p>
          <p className="text-xs text-slate-500">{employee.designation}</p>
        </div>
      </div>
    </Link>
  );
}

export default function OrgChartPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const getById = useEmployeeStore((s) => s.getById);
  const getTeam = useEmployeeStore((s) => s.getTeam);

  const [expandedHeads, setExpandedHeads] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) return;
    if (session.role !== "hr" && session.role !== "manager") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const toggleHead = (headId: string) => {
    setExpandedHeads((prev) => {
      const next = new Set(prev);
      if (next.has(headId)) next.delete(headId);
      else next.add(headId);
      return next;
    });
  };

  const heads = DEPARTMENTS.map((d) => ({
    department: d,
    head: getById(d.headId),
  })).filter((h): h is { department: (typeof DEPARTMENTS)[0]; head: Employee } => !!h.head);

  if (!session || (session.role !== "hr" && session.role !== "manager")) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Org Chart"
        description="Company structure by department and reporting lines."
      />

      {/* Root */}
      <div className="flex justify-center">
        <Card className="rounded-xl border-2 border-primary/20 bg-slate-50 px-6 py-4">
          <CardContent className="flex items-center gap-3 p-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-slate-900">Company</p>
              <p className="text-sm text-slate-500">PeopleOS</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connector line (visual) */}
      <div className="flex justify-center">
        <div className="h-6 w-px bg-slate-200" />
      </div>

      {/* Department heads */}
      <div>
        <p className="mb-4 text-center text-sm font-medium text-slate-500">Department heads</p>
        <div className="flex flex-wrap justify-center gap-6">
          {heads.map(({ department, head }) => (
            <div key={department.id} className="flex flex-col items-center">
              <OrgNode
                employee={head}
                title={`${head.designation} · ${department.name}`}
              />
              {/* Expand/collapse for team */}
              {getTeam(head.id).length > 0 && (
                <div className="mt-3 flex flex-col items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-slate-600"
                    onClick={() => toggleHead(head.id)}
                  >
                    {expandedHeads.has(head.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {getTeam(head.id).length} report{getTeam(head.id).length !== 1 ? "s" : ""}
                  </Button>
                  {expandedHeads.has(head.id) && (
                    <>
                      <div className="my-2 h-4 w-px bg-slate-200" />
                      <div className="flex flex-wrap justify-center gap-3">
                        {getTeam(head.id).map((emp) => (
                          <OrgNode
                            key={emp.id}
                            employee={emp}
                            title={emp.department}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
