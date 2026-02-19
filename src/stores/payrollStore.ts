import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PAYROLL_RUNS, PAYSLIPS } from "@/data/dummyData";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useAdminStore } from "@/stores/adminStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type { PayrollRun, Payslip, PayslipEarnings, PayslipDeductions } from "@/types";

const WORKING_DAYS = 26;

interface PayrollState {
  runs: PayrollRun[];
  payslips: Payslip[];
  getRunForMonth: (month: string) => PayrollRun | undefined;
  ensureRunForMonth: (month: string) => PayrollRun;
  getPayslipsForMonth: (month: string) => Payslip[];
  runPayroll: (month: string) => Promise<void>;
  getPayslipsForEmployee: (employeeId: string) => Payslip[];
}

function nextRunId(runs: PayrollRun[]): string {
  const nums = runs.map((r) => parseInt(r.id.replace("pr", ""), 10)).filter((n) => !Number.isNaN(n));
  return `pr${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

function nextPayslipId(payslips: Payslip[]): string {
  const nums = payslips.map((p) => parseInt(p.id.replace("ps", ""), 10)).filter((n) => !Number.isNaN(n));
  return `ps${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

function generatePayslip(
  employeeId: string,
  payrollRunId: string,
  month: string,
  annualBasic: number,
  annualHra: number,
  annualAllowances: number,
  workingDays = 26,
  presentDays = 26
): Payslip {
  const basic = Math.round(annualBasic / 12);
  const hra = Math.round(annualHra / 12);
  const transportAllowance = 3200;
  const medicalAllowance = 1250;
  const specialAllowance = Math.round(annualAllowances / 12) - transportAllowance - medicalAllowance;
  const grossSalary = basic + hra + transportAllowance + medicalAllowance + Math.max(0, specialAllowance);
  const pf = Math.round(basic * 0.12);
  const esic = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;
  const professionalTax = 200;
  const tds = Math.round(grossSalary * 0.05);
  const totalDeductions = pf + esic + professionalTax + tds;
  const lop = workingDays - presentDays;
  const lopAmount = lop > 0 ? Math.round((basic / workingDays) * lop) : 0;
  const netSalary = grossSalary - totalDeductions - lopAmount;

  const earnings: PayslipEarnings = {
    basic,
    hra,
    transportAllowance,
    medicalAllowance,
    specialAllowance: Math.max(0, specialAllowance),
  };
  const deductions: PayslipDeductions = { pf, esic, professionalTax, tds };

  return {
    id: "", // set by store
    employeeId,
    payrollRunId,
    month,
    earnings,
    deductions,
    grossSalary,
    totalDeductions,
    netSalary,
    workingDays,
    presentDays,
    lop,
    lopAmount,
    generatedOn: new Date().toISOString().slice(0, 10),
  };
}

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set, get) => ({
      runs: PAYROLL_RUNS,
      payslips: PAYSLIPS,

      getRunForMonth: (month) => get().runs.find((r) => r.month === month),

      ensureRunForMonth: (month) => {
        let run = get().runs.find((r) => r.month === month);
        if (!run) {
          const runs = get().runs;
          run = {
            id: nextRunId(runs),
            month,
            status: "Draft",
            processedOn: null,
            processedBy: null,
            totalEmployees: 0,
            totalGross: 0,
            totalDeductions: 0,
            totalNet: 0,
          };
          set((state) => ({ runs: [...state.runs, run!] }));
        }
        return run;
      },

      getPayslipsForMonth: (month) =>
        get().payslips.filter((p) => p.month === month),

      runPayroll: async (month) => {
        const run = get().runs.find((r) => r.month === month);
        if (!run || run.status !== "Draft") return;
        set((state) => ({
          runs: state.runs.map((r) =>
            r.id === run.id ? { ...r, status: "Processing" as const } : r
          ),
        }));
        await new Promise((r) => setTimeout(r, 1500));
        const employees = useEmployeeStore.getState().employees.filter((e) => e.status === "Active");
        const getMonthly = useAttendanceStore.getState().getMonthly;
        const [y, m] = month.split("-").map(Number);
        const session = useAuthStore.getState().session;
        const processedBy = session?.employeeId ?? "EMP001";
        const payrollRunId = run.id;
        const newPayslips: Payslip[] = [];
        let totalGross = 0;
        let totalDeductions = 0;
        const existingPayslips = get().payslips;
        let psIdx = existingPayslips.length;
        for (const emp of employees) {
          const monthRecords = getMonthly(emp.id, y, m);
          const presentDays = monthRecords.filter(
            (r) => r.status === "Present" || r.status === "Late" || r.status === "Half Day"
          ).length;
          const slip = generatePayslip(
            emp.id,
            payrollRunId,
            month,
            emp.salary.basic,
            emp.salary.hra,
            emp.salary.allowances,
            WORKING_DAYS,
            presentDays
          );
          slip.id = `ps${++psIdx}`;
          newPayslips.push(slip);
          totalGross += slip.grossSalary;
          totalDeductions += slip.totalDeductions;
        }
        const totalNet = totalGross - totalDeductions;
        set((state) => ({
          runs: state.runs.map((r) =>
            r.id === run.id
              ? {
                  ...r,
                  status: "Processed" as const,
                  processedOn: new Date().toISOString().slice(0, 10),
                  processedBy,
                  totalEmployees: employees.length,
                  totalGross,
                  totalDeductions,
                  totalNet,
                }
              : r
          ),
          payslips: [...state.payslips, ...newPayslips],
        }));
        useAdminStore.getState().addAuditLog({
          action: "Payroll Processed",
          module: "Payroll",
          performedBy: processedBy,
          target: run.id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `${month} payroll for ${employees.length} employees`,
        });
        const users = useAdminStore.getState().users;
        const monthLabel = new Date(month + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" });
        users.forEach((u) => {
          useNotificationStore.getState().addNotification({
            userId: u.id,
            title: "Payroll processed",
            message: `${monthLabel} payroll has been processed. Your payslip is available.`,
            link: "/payroll/payslips",
          });
        });
      },

      getPayslipsForEmployee: (employeeId) =>
        get().payslips.filter((p) => p.employeeId === employeeId),
    }),
    { name: "hrms-payroll", storage: createJSONStorage(() => localStorage) }
  )
);
