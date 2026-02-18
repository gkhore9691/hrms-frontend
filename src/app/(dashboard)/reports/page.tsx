"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { EmptyState } from "@/components/common/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { usePayrollStore } from "@/stores/payrollStore";
import { useLeaveStore } from "@/stores/leaveStore";
import { DEPARTMENTS } from "@/data/dummyData";
import { BarChart2, Download } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const employees = useEmployeeStore((s) => s.employees);
  const getTeam = useEmployeeStore((s) => s.getTeam);
  const records = useAttendanceStore((s) => s.records);
  const runs = usePayrollStore((s) => s.runs);
  const payslips = usePayrollStore((s) => s.payslips);
  const leaveTypes = useLeaveStore((s) => s.leaveTypes);
  const balances = useLeaveStore((s) => s.balances);

  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [attMonth, setAttMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [payrollMonths, setPayrollMonths] = useState(12);

  useEffect(() => {
    if (session && session.role !== "hr" && session.role !== "manager") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const teamIds = useMemo(() => {
    if (session?.role !== "manager" || !session?.employeeId) return new Set<string>();
    return new Set(getTeam(session.employeeId).map((e) => e.id));
  }, [session?.role, session?.employeeId, getTeam]);

  const filteredEmployees = useMemo(() => {
    if (session?.role === "employee") return [];
    if (deptFilter === "all") return session?.role === "manager" ? employees.filter((e) => teamIds.has(e.id)) : employees;
    return employees.filter((e) => e.department === deptFilter);
  }, [employees, session?.role, deptFilter, teamIds]);

  const empIds = useMemo(() => new Set(filteredEmployees.map((e) => e.id)), [filteredEmployees]);

  // Attendance report data
  const attDataByDay = useMemo(() => {
    const [y, m] = attMonth.split("-").map(Number);
    const prefix = attMonth;
    const byDay: Record<string, { Present: number; Absent: number; Late: number; Leave: number }> = {};
    records
      .filter((r) => r.date.startsWith(prefix) && empIds.has(r.employeeId))
      .forEach((r) => {
        if (!byDay[r.date]) byDay[r.date] = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
        if (r.status === "Present" || r.status === "Half Day") byDay[r.date].Present++;
        else if (r.status === "Absent") byDay[r.date].Absent++;
        else if (r.status === "Late") byDay[r.date].Late++;
        else if (r.status === "On Leave") byDay[r.date].Leave++;
      });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v }));
  }, [records, attMonth, empIds]);

  const attSummaryByEmp = useMemo(() => {
    const [y, m] = attMonth.split("-").map(Number);
    const prefix = attMonth;
    const byEmp: Record<string, { present: number; absent: number; late: number; leave: number }> = {};
    filteredEmployees.forEach((e) => (byEmp[e.id] = { present: 0, absent: 0, late: 0, leave: 0 }));
    records
      .filter((r) => r.date.startsWith(prefix) && empIds.has(r.employeeId))
      .forEach((r) => {
        if (!byEmp[r.employeeId]) byEmp[r.employeeId] = { present: 0, absent: 0, late: 0, leave: 0 };
        if (r.status === "Present" || r.status === "Half Day") byEmp[r.employeeId].present++;
        else if (r.status === "Absent") byEmp[r.employeeId].absent++;
        else if (r.status === "Late") byEmp[r.employeeId].late++;
        else if (r.status === "On Leave") byEmp[r.employeeId].leave++;
      });
    return Object.entries(byEmp).map(([employeeId, v]) => {
      const total = v.present + v.absent + v.late + v.leave;
      const pct = total > 0 ? Math.round((v.present / total) * 100) : 0;
      return { employeeId, ...v, total, pct };
    });
  }, [records, attMonth, filteredEmployees, empIds]);

  // Payroll report data
  const payrollChartData = useMemo(() => {
    const runList = runs.slice(-payrollMonths).sort((a, b) => a.month.localeCompare(b.month));
    return runList.map((r) => ({
      month: r.month,
      Gross: r.totalGross,
      Net: r.totalNet,
    }));
  }, [runs, payrollMonths]);

  const payrollByDept = useMemo(() => {
    const byDept: Record<string, { gross: number; net: number; count: number }> = {};
    payslips.forEach((ps) => {
      const emp = employees.find((e) => e.id === ps.employeeId);
      if (!emp || (deptFilter !== "all" && emp.department !== deptFilter)) return;
      if (session?.role === "manager" && !teamIds.has(emp.id)) return;
      const d = emp.department;
      if (!byDept[d]) byDept[d] = { gross: 0, net: 0, count: 0 };
      byDept[d].gross += ps.grossSalary;
      byDept[d].net += ps.netSalary;
      byDept[d].count++;
    });
    return Object.entries(byDept).map(([dept, v]) => ({ department: dept, ...v }));
  }, [payslips, employees, deptFilter, session?.role, teamIds]);

  // Headcount
  const headcountByDept = useMemo(() => {
    const list = filteredEmployees;
    const byDept: Record<string, { count: number; male: number; female: number; newJoiners: number; exits: number }> = {};
    DEPARTMENTS.forEach((d) => (byDept[d.name] = { count: 0, male: 0, female: 0, newJoiners: 0, exits: 0 }));
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    list.forEach((e) => {
      const d = e.department;
      if (!byDept[d]) byDept[d] = { count: 0, male: 0, female: 0, newJoiners: 0, exits: 0 };
      byDept[d].count++;
      if (e.gender === "Male") byDept[d].male++;
      if (e.gender === "Female") byDept[d].female++;
      if (e.dateOfJoining >= cutoffStr) byDept[d].newJoiners++;
      if (e.status === "Inactive") byDept[d].exits++;
    });
    return Object.entries(byDept).filter(([, v]) => v.count > 0).map(([department, v]) => ({ department, ...v }));
  }, [filteredEmployees]);

  const headcountTrend = useMemo(() => {
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }
    return months.map((month) => ({
      month,
      count: employees.filter((e) => e.dateOfJoining.slice(0, 7) <= month).length,
    }));
  }, [employees]);

  // Leave report
  const leaveUsageData = useMemo(() => {
    const byType: Record<string, number> = {};
    leaveTypes.forEach((t) => (byType[t.name] = 0));
    balances.forEach((b) => {
      const emp = employees.find((e) => e.id === b.employeeId);
      if (!emp || (session?.role === "manager" && !teamIds.has(emp.id)) || (deptFilter !== "all" && emp.department !== deptFilter)) return;
      const type = leaveTypes.find((t) => t.id === b.leaveTypeId);
      if (type) byType[type.name] = (byType[type.name] ?? 0) + b.used;
    });
    return Object.entries(byType).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  }, [balances, leaveTypes, employees, session?.role, teamIds, deptFilter]);

  const leaveTableData = useMemo(() => {
    return filteredEmployees.map((emp) => {
      const empBalances = balances.filter((b) => b.employeeId === emp.id);
      const al = empBalances.find((b) => leaveTypes.find((t) => t.id === b.leaveTypeId && t.name.includes("Annual")));
      const sl = empBalances.find((b) => leaveTypes.find((t) => t.id === b.leaveTypeId && t.name.includes("Sick")));
      const cl = empBalances.find((b) => leaveTypes.find((t) => t.id === b.leaveTypeId && t.name.includes("Casual")));
      return {
        employeeId: emp.id,
        name: emp.name,
        alUsed: al?.used ?? 0,
        slUsed: sl?.used ?? 0,
        clUsed: cl?.used ?? 0,
        balance: (al?.balance ?? 0) + (sl?.balance ?? 0) + (cl?.balance ?? 0),
      };
    });
  }, [filteredEmployees, balances, leaveTypes]);

  // Attrition (simplified: no exit dates)
  const inactiveCount = useMemo(() => employees.filter((e) => e.status === "Inactive").length, [employees]);
  const attritionPct = employees.length > 0 ? Math.round((inactiveCount / employees.length) * 100) : 0;
  const attritionTableData = useMemo(() => {
    const byDept: Record<string, { exits: number; count: number }> = {};
    employees.forEach((e) => {
      if (!byDept[e.department]) byDept[e.department] = { exits: 0, count: 0 };
      byDept[e.department].count++;
      if (e.status === "Inactive") byDept[e.department].exits++;
    });
    const total = employees.length;
    return [{ quarter: "Current", totalExits: inactiveCount, attritionPct: total ? Math.round((inactiveCount / total) * 100) : 0 }];
  }, [employees, inactiveCount]);

  // Compliance (statutory deductions summary from payroll)
  const complianceData = useMemo(() => {
    const byMonth: Record<string, { pf: number; esic: number; professionalTax: number; tds: number; count: number }> = {};
    payslips.forEach((ps) => {
      if (!empIds.has(ps.employeeId)) return;
      const m = ps.month;
      if (!byMonth[m]) byMonth[m] = { pf: 0, esic: 0, professionalTax: 0, tds: 0, count: 0 };
      byMonth[m].pf += ps.deductions.pf ?? 0;
      byMonth[m].esic += ps.deductions.esic ?? 0;
      byMonth[m].professionalTax += ps.deductions.professionalTax ?? 0;
      byMonth[m].tds += ps.deductions.tds ?? 0;
      byMonth[m].count++;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([month, v]) => ({ month: month, ...v }));
  }, [payslips, empIds]);

  const handleExport = () => {
    toast.success("Report exported successfully");
  };

  if (!session || (session.role !== "hr" && session.role !== "manager")) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Attendance, payroll, headcount, leave, attrition, and compliance reports." />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="headcount">Headcount</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="attrition">Attrition</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <div className="flex gap-2">
            <input type="month" className="rounded-md border px-3 py-2 text-sm" value={attMonth} onChange={(e) => setAttMonth(e.target.value)} />
          </div>
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Day-wise attendance</CardTitle></CardHeader>
            <CardContent>
              {attDataByDay.length === 0 ? (
                <EmptyState icon={BarChart2} title="No data" description="No attendance data for selected period." />
              ) : (
                <BarChart
                  data={attDataByDay}
                  xAxisKey="day"
                  bars={[
                    { dataKey: "Present", name: "Present", color: "#10B981" },
                    { dataKey: "Absent", name: "Absent", color: "#EF4444" },
                    { dataKey: "Late", name: "Late", color: "#F59E0B" },
                    { dataKey: "Leave", name: "Leave", color: "#2563EB" },
                  ]}
                  height={280}
                />
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Summary by employee</CardTitle></CardHeader>
            <CardContent>
              {attSummaryByEmp.length === 0 ? (
                <p className="text-sm text-slate-500">No data for selected period.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead>Late</TableHead><TableHead>Leave</TableHead><TableHead>%</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {attSummaryByEmp.map((row) => {
                      const emp = employees.find((e) => e.id === row.employeeId);
                      return (
                        <TableRow key={row.employeeId}>
                          <TableCell className="font-medium">{emp?.name ?? row.employeeId}</TableCell>
                          <TableCell>{row.present}</TableCell><TableCell>{row.absent}</TableCell><TableCell>{row.late}</TableCell><TableCell>{row.leave}</TableCell>
                          <TableCell>{row.pct}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <div className="flex gap-2">
            <Select value={String(payrollMonths)} onValueChange={(v) => setPayrollMonths(Number(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Month-wise Gross vs Net</CardTitle></CardHeader>
            <CardContent>
              {payrollChartData.length === 0 ? (
                <EmptyState icon={BarChart2} title="No data" description="No payroll runs for selected range." />
              ) : (
                <BarChart data={payrollChartData} xAxisKey="month" bars={[{ dataKey: "Gross", name: "Gross", color: "#2563EB" }, { dataKey: "Net", name: "Net", color: "#10B981" }]} height={280} />
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Department summary</CardTitle></CardHeader>
            <CardContent>
              {payrollByDept.length === 0 ? (
                <p className="text-sm text-slate-500">No payroll data.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Employees</TableHead><TableHead>Gross</TableHead><TableHead>Net</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payrollByDept.map((row) => (
                      <TableRow key={row.department}>
                        <TableCell className="font-medium">{row.department}</TableCell>
                        <TableCell>{row.count}</TableCell>
                        <TableCell>₹{row.gross.toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{row.net.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="headcount" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-xl shadow-sm">
              <CardHeader><CardTitle className="text-base">Department distribution</CardTitle></CardHeader>
              <CardContent>
                {headcountByDept.length === 0 ? (
                  <p className="text-sm text-slate-500">No data.</p>
                ) : (
                  <DonutChart data={headcountByDept.map((d) => ({ name: d.department, value: d.count }))} height={260} />
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm">
              <CardHeader><CardTitle className="text-base">Monthly headcount trend</CardTitle></CardHeader>
              <CardContent>
                <LineChart data={headcountTrend} xAxisKey="month" lines={[{ dataKey: "count", name: "Headcount", color: "#2563EB" }]} height={260} />
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Department breakdown</CardTitle></CardHeader>
            <CardContent>
              {headcountByDept.length === 0 ? (
                <p className="text-sm text-slate-500">No data.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Department</TableHead><TableHead>Count</TableHead><TableHead>Male</TableHead><TableHead>Female</TableHead><TableHead>New joiners</TableHead><TableHead>Exits</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {headcountByDept.map((row) => (
                      <TableRow key={row.department}>
                        <TableCell className="font-medium">{row.department}</TableCell>
                        <TableCell>{row.count}</TableCell><TableCell>{row.male}</TableCell><TableCell>{row.female}</TableCell><TableCell>{row.newJoiners}</TableCell><TableCell>{row.exits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Leave type usage</CardTitle></CardHeader>
            <CardContent>
              {leaveUsageData.length === 0 ? (
                <p className="text-sm text-slate-500">No leave data.</p>
              ) : (
                <BarChart data={leaveUsageData} xAxisKey="name" bars={[{ dataKey: "value", name: "Days used", color: "#2563EB" }]} height={260} />
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Employee leave summary</CardTitle></CardHeader>
            <CardContent>
              {leaveTableData.length === 0 ? (
                <p className="text-sm text-slate-500">No data.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>AL used</TableHead><TableHead>SL used</TableHead><TableHead>CL used</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {leaveTableData.map((row) => (
                      <TableRow key={row.employeeId}><TableCell className="font-medium">{row.name}</TableCell><TableCell>{row.alUsed}</TableCell><TableCell>{row.slUsed}</TableCell><TableCell>{row.clUsed}</TableCell><TableCell>{row.balance}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attrition" className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Attrition summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Total exits (Inactive): {inactiveCount} · Attrition %: {attritionPct}%</p>
              <Table>
                <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Total exits</TableHead><TableHead>Attrition %</TableHead></TableRow></TableHeader>
                <TableBody>
                  {attritionTableData.map((row, i) => (
                    <TableRow key={i}><TableCell>{row.quarter}</TableCell><TableCell>{row.totalExits}</TableCell><TableCell>{row.attritionPct}%</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle className="text-base">Statutory deductions (PF, ESIC, PT, TDS)</CardTitle></CardHeader>
            <CardContent>
              {complianceData.length === 0 ? (
                <p className="text-sm text-slate-500">No payroll data for selected scope.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Payslips</TableHead>
                      <TableHead>PF</TableHead>
                      <TableHead>ESIC</TableHead>
                      <TableHead>Professional Tax</TableHead>
                      <TableHead>TDS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceData.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium">{row.month}</TableCell>
                        <TableCell>{row.count}</TableCell>
                        <TableCell>₹{row.pf.toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{row.esic.toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{row.professionalTax.toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{row.tds.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
