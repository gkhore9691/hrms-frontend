"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Banknote, Play, FileText } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { usePayrollStore } from "@/stores/payrollStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/charts/StatCard";
import { formatCurrency } from "@/lib/formatters";

function monthOptions(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let y = 2024; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      const value = `${y}-${String(m).padStart(2, "0")}`;
      const d = new Date(y, m - 1, 1);
      out.push({ value, label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }) });
    }
  }
  return out;
}

export default function PayrollPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const getById = useEmployeeStore((s) => s.getById);
  const runs = usePayrollStore((s) => s.runs);
  const getRunForMonth = usePayrollStore((s) => s.getRunForMonth);
  const ensureRunForMonth = usePayrollStore((s) => s.ensureRunForMonth);
  const getPayslipsForMonth = usePayrollStore((s) => s.getPayslipsForMonth);
  const runPayroll = usePayrollStore((s) => s.runPayroll);

  const [month, setMonth] = useState("2025-02");
  const [run, setRun] = useState<ReturnType<typeof getRunForMonth>>(undefined);
  const [processing, setProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    const r = ensureRunForMonth(month);
    setRun(r);
  }, [month, ensureRunForMonth, runs]);

  const payslips = run ? getPayslipsForMonth(month) : [];
  const activeCount = useEmployeeStore((s) => s.employees.filter((e) => e.status === "Active").length);
  const employeeCount = run?.status === "Processed" ? run.totalEmployees : activeCount;

  const handleRunPayroll = async () => {
    setConfirmOpen(false);
    setProcessing(true);
    try {
      await runPayroll(month);
      toast.success("Payroll processed successfully");
      setRun(getRunForMonth(month));
    } finally {
      setProcessing(false);
    }
  };

  if (!session || session.role !== "hr") return null;

  const months = monthOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Run monthly payroll and view summary."
      />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/payroll/salary-structures">Salary structures</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/payroll/payslips">Payslips</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {run?.status === "Draft" && (
          <>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={processing}
            >
              {processing ? (
                "Processing…"
              ) : (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  Run Payroll
                </>
              )}
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              onConfirm={handleRunPayroll}
              title="Run payroll"
              description={`Are you sure? This will process salaries for ${employeeCount} employees for ${months.find((m) => m.value === month)?.label ?? month}.`}
              confirmLabel="Run"
            />
          </>
        )}
      </div>

      {run && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Status"
              value={run.status}
              icon={Banknote}
            />
            <StatCard
              title="Total Gross"
              value={formatCurrency(run.totalGross)}
            />
            <StatCard
              title="Total Deductions"
              value={formatCurrency(run.totalDeductions)}
            />
            <StatCard
              title="Total Net Pay"
              value={formatCurrency(run.totalNet)}
            />
            <StatCard
              title="Employees"
              value={run.status === "Processed" ? run.totalEmployees : activeCount}
            />
          </div>

          {processing && (
            <Card className="rounded-xl border-amber-200 bg-amber-50/50">
              <CardContent className="py-6">
                <p className="text-center text-sm font-medium text-amber-800">
                  Processing payroll…
                </p>
                <div className="mx-auto mt-2 h-2 w-48 overflow-hidden rounded-full bg-amber-200">
                  <div className="h-full w-full animate-pulse rounded-full bg-amber-500" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Payroll summary</CardTitle>
            </CardHeader>
            <CardContent>
              {run.status !== "Processed" || payslips.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={run.status === "Draft" ? "Run payroll to generate payslips" : "No payslips yet"}
                  description={
                    run.status === "Draft"
                      ? "Click Run Payroll to process salaries for the selected month."
                      : "Processing may still be in progress."
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Basic</TableHead>
                      <TableHead>HRA</TableHead>
                      <TableHead>Other</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>PF</TableHead>
                      <TableHead>TDS</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead className="w-[80px]">Payslip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((ps) => {
                      const emp = getById(ps.employeeId);
                      const other =
                        (ps.earnings.transportAllowance || 0) +
                        (ps.earnings.medicalAllowance || 0) +
                        (ps.earnings.specialAllowance || 0);
                      return (
                        <TableRow key={ps.id}>
                          <TableCell className="font-medium">
                            {emp?.name ?? ps.employeeId}
                          </TableCell>
                          <TableCell>{formatCurrency(ps.earnings.basic)}</TableCell>
                          <TableCell>{formatCurrency(ps.earnings.hra)}</TableCell>
                          <TableCell>{formatCurrency(other)}</TableCell>
                          <TableCell>{formatCurrency(ps.grossSalary)}</TableCell>
                          <TableCell>{formatCurrency(ps.deductions.pf)}</TableCell>
                          <TableCell>{formatCurrency(ps.deductions.tds)}</TableCell>
                          <TableCell>{formatCurrency(ps.netSalary)}</TableCell>
                          <TableCell>
                            <Button variant="link" size="sm" className="h-auto p-0" asChild>
                              <Link href={`/payroll/payslips?payslip=${ps.id}`}>
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
