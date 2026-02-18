"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { usePayrollStore } from "@/stores/payrollStore";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { PayslipDetail } from "@/components/payroll/PayslipDetail";
import { formatCurrency } from "@/lib/formatters";

export default function PayslipsPage() {
  const searchParams = useSearchParams();
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? "";
  const getById = useEmployeeStore((s) => s.getById);
  const payslips = usePayrollStore((s) => s.payslips);
  const getPayslipsForEmployee = usePayrollStore((s) => s.getPayslipsForEmployee);

  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [viewId, setViewId] = useState<string | null>(() => searchParams.get("payslip"));

  const isHR = session?.role === "hr";

  const list = useMemo(() => {
    let items = isHR ? payslips : getPayslipsForEmployee(employeeId);
    if (monthFilter !== "all") {
      items = items.filter((p) => p.month === monthFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((p) => {
        const emp = getById(p.employeeId);
        return emp?.name.toLowerCase().includes(q) || p.employeeId.toLowerCase().includes(q);
      });
    }
    return items.sort((a, b) => b.month.localeCompare(a.month));
  }, [isHR, payslips, getPayslipsForEmployee, employeeId, monthFilter, search, getById]);

  const months = useMemo(() => {
    const set = new Set(payslips.map((p) => p.month));
    return Array.from(set).sort().reverse();
  }, [payslips]);

  const selectedPayslip = viewId ? payslips.find((p) => p.id === viewId) : null;
  const selectedEmployee = selectedPayslip ? getById(selectedPayslip.employeeId) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslips"
        description={isHR ? "View all employee payslips" : "Your payslips"}
      />

      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-6">
          {list.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No payslips"
              description={
                isHR
                  ? "No payslips match your filters, or payroll has not been run yet."
                  : "You don’t have any payslips yet."
              }
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {isHR && (
                  <Input
                    placeholder="Search employee..."
                    className="max-w-[200px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                )}
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    {isHR && <TableHead>Employee</TableHead>}
                    <TableHead>Month</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((ps) => {
                    const emp = getById(ps.employeeId);
                    return (
                      <TableRow key={ps.id}>
                        {isHR && (
                          <TableCell className="font-medium">
                            {emp?.name ?? ps.employeeId}
                          </TableCell>
                        )}
                        <TableCell>{ps.month}</TableCell>
                        <TableCell>{formatCurrency(ps.netSalary)}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => setViewId(ps.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewId} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <PayslipDetail
              payslip={selectedPayslip}
              employee={selectedEmployee}
              showPrintButton={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
