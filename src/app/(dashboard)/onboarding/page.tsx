"use client";

import { useMemo } from "react";
import Link from "next/link";
import { UserCheck, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/formatters";

export default function OnboardingPage() {
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? "";
  const getTeam = useEmployeeStore((s) => s.getTeam);
  const getById = useEmployeeStore((s) => s.getById);
  const checklists = useOnboardingStore((s) => s.checklists);
  const getChecklistForEmployee = useOnboardingStore((s) => s.getChecklistForEmployee);
  const getCompletionPercent = useOnboardingStore((s) => s.getCompletionPercent);

  const myChecklist = useMemo(
    () => getChecklistForEmployee(employeeId),
    [getChecklistForEmployee, employeeId]
  );

  const teamIds = useMemo(() => {
    if (session?.role !== "manager" || !session?.employeeId) return new Set<string>();
    return new Set(getTeam(session.employeeId).map((e) => e.id));
  }, [session?.role, session?.employeeId, getTeam]);

  const visibleChecklists = useMemo(() => {
    if (session?.role === "employee") return myChecklist ? [myChecklist] : [];
    if (session?.role === "manager") {
      return checklists.filter((cl) => teamIds.has(cl.employeeId));
    }
    return checklists;
  }, [session?.role, checklists, teamIds, myChecklist]);

  if (!session) return null;

  if (session.role === "employee") {
    if (!myChecklist) {
      return (
        <div className="space-y-6">
          <PageHeader title="Onboarding" description="Your onboarding checklist." />
          <EmptyState
            icon={UserCheck}
            title="No active onboarding"
            description="You don't have an onboarding checklist assigned yet. Contact HR if you're a new joiner."
          />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <PageHeader title="Onboarding" description="Complete your onboarding tasks." />
        <Card className="rounded-xl border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="flex flex-row items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">Welcome!</h2>
                <p className="text-sm text-slate-600">Complete your onboarding checklist to get started.</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/onboarding/${myChecklist.id}`}>My Onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding"
        description={
          session.role === "hr"
            ? "Track new joiner onboarding progress"
            : "Team onboarding progress"
        }
      />

      {visibleChecklists.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No onboarding checklists"
          description="No active onboarding checklists."
        />
      ) : (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleChecklists.map((cl) => {
                  const emp = getById(cl.employeeId);
                  const percent = getCompletionPercent(cl.id);
                  return (
                    <TableRow key={cl.id}>
                      <TableCell className="font-medium">
                        {emp?.name ?? cl.employeeId}
                      </TableCell>
                      <TableCell>{formatDate(cl.assignedOn)}</TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-700">{percent}%</span>
                      </TableCell>
                      <TableCell>
                        <Button variant="link" size="sm" className="h-auto p-0" asChild>
                          <Link href={`/onboarding/${cl.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
