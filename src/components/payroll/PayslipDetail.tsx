"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Payslip } from "@/types";
import type { Employee } from "@/types";

interface PayslipDetailProps {
  payslip: Payslip;
  employee: Employee | undefined;
  onClose?: () => void;
  showPrintButton?: boolean;
}

function maskAccount(accountNo: string): string {
  if (!accountNo || accountNo.length < 4) return "****";
  return "****" + accountNo.slice(-4);
}

export function PayslipDetail({
  payslip,
  employee,
  onClose,
  showPrintButton = true,
}: PayslipDetailProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (containerRef.current) {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        window.print();
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html><html><head><title>Payslip ${payslip.month}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; }
          th { color: #64748b; font-weight: 500; }
          .header { text-align: center; margin-bottom: 24px; }
          .section { margin: 16px 0; }
        </style></head><body>
        ${containerRef.current.innerHTML}
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    } else {
      window.print();
    }
  };

  const content = (
    <div ref={containerRef} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-center">
        <p className="font-display text-lg font-semibold text-slate-900">PeopleOS</p>
        <p className="text-sm font-medium uppercase tracking-wider text-slate-500">Payslip</p>
        <p className="mt-1 text-sm text-slate-600">
          Pay period: {payslip.month} · Generated: {formatDate(payslip.generatedOn)}
        </p>
      </div>

      <div className="grid gap-2 text-sm">
        <p className="font-medium text-slate-900">{employee?.name ?? payslip.employeeId}</p>
        <p className="text-slate-600">ID: {payslip.employeeId}</p>
        {employee && (
          <>
            <p className="text-slate-600">Department: {employee.department}</p>
            <p className="text-slate-600">Designation: {employee.designation}</p>
            <p className="text-slate-600">
              Bank: {employee.bankAccount.bank} · A/c: {maskAccount(employee.bankAccount.accountNo)}
            </p>
            <p className="text-slate-600">PAN: —</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Working days</p>
          <p className="font-medium">{payslip.workingDays}</p>
        </div>
        <div>
          <p className="text-slate-500">Present</p>
          <p className="font-medium">{payslip.presentDays}</p>
        </div>
        <div>
          <p className="text-slate-500">LOP</p>
          <p className="font-medium">{payslip.lop}</p>
        </div>
      </div>

      <div className="section">
        <p className="mb-2 font-medium text-slate-700">Earnings</p>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1 text-slate-600">Basic</td>
              <td className="text-right">{formatCurrency(payslip.earnings.basic)}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600">HRA</td>
              <td className="text-right">{formatCurrency(payslip.earnings.hra)}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600">Transport</td>
              <td className="text-right">{formatCurrency(payslip.earnings.transportAllowance)}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600">Medical</td>
              <td className="text-right">{formatCurrency(payslip.earnings.medicalAllowance)}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600">Special</td>
              <td className="text-right">{formatCurrency(payslip.earnings.specialAllowance)}</td>
            </tr>
            <tr className="border-t border-slate-200">
              <td className="py-2 font-medium text-slate-900">Gross</td>
              <td className="text-right font-medium">{formatCurrency(payslip.grossSalary)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section">
        <p className="mb-2 font-medium text-slate-700">Deductions</p>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1 text-slate-600">PF</td>
              <td className="text-right">{formatCurrency(payslip.deductions.pf)}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600">ESI</td>
              <td className="text-right">{formatCurrency(payslip.deductions.esic)}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600">Professional Tax</td>
              <td className="text-right">{formatCurrency(payslip.deductions.professionalTax)}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-600">TDS</td>
              <td className="text-right">{formatCurrency(payslip.deductions.tds)}</td>
            </tr>
            <tr className="border-t border-slate-200">
              <td className="py-2 font-medium text-slate-900">Total Deductions</td>
              <td className="text-right font-medium">{formatCurrency(payslip.totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {payslip.lopAmount > 0 && (
        <p className="text-sm text-slate-600">
          LOP deduction: {formatCurrency(payslip.lopAmount)}
        </p>
      )}

      <div className="border-t border-slate-200 pt-4">
        <p className="text-lg font-semibold text-slate-900">
          Net Salary: {formatCurrency(payslip.netSalary)}
        </p>
      </div>

      {showPrintButton && (
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Download className="mr-1 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      )}
    </div>
  );

  return content;
}
