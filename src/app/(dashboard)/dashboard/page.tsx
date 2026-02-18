"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Briefcase,
  CalendarDays,
  UserPlus,
  Banknote,
  BarChart2,
  TrendingUp,
  Calendar,
  Gift,
} from "lucide-react";
import { subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval, format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useLeaveStore } from "@/stores/leaveStore";
import { usePayrollStore } from "@/stores/payrollStore";
import { useRecruitmentStore } from "@/stores/recruitmentStore";
import { usePerformanceStore } from "@/stores/performanceStore";
import { HOLIDAYS } from "@/data/dummyData";
import { StatCard } from "@/components/charts/StatCard";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

function HRDashboard() {
  const employees = useEmployeeStore((s) => s.employees);
  const requests = useLeaveStore((s) => s.requests);
  const leaveTypes = useLeaveStore((s) => s.leaveTypes);
  const approveLeave = useLeaveStore((s) => s.approveLeave);
  const rejectLeave = useLeaveStore((s) => s.rejectLeave);
  const jobs = useRecruitmentStore((s) => s.jobs);
  const records = useAttendanceStore((s) => s.records);

  const activeEmployees = employees.filter((e) => e.status === "Active");
  const totalEmployees = activeEmployees.length;
  const joinedThisMonth = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return employees.filter((e) => {
      const doj = parseISO(e.dateOfJoining);
      return isWithinInterval(doj, { start, end });
    }).length;
  }, [employees]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const presentToday = useMemo(() => {
    return records.filter(
      (r) => r.date === todayStr && (r.status === "Present" || r.status === "Late")
    ).length;
  }, [records, todayStr]);
  const attendancePct = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  const openJobs = jobs.filter((j) => j.status === "Open");
  const openPositions = openJobs.length;
  const totalApplicants = openJobs.reduce((s, j) => s + j.applicantCount, 0);

  const pendingLeaves = requests.filter((r) => r.status === "Pending");

  const headcountByMonth = useMemo(() => {
    const months: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const monthKey = format(d, "yyyy-MM");
      const end = endOfMonth(d);
      const count = employees.filter((e) => {
        const doj = parseISO(e.dateOfJoining);
        return doj <= end && (e.status === "Active" || doj.getTime() <= end.getTime());
      }).length;
      months.push({ month: format(d, "MMM yy"), count });
    }
    return months;
  }, [employees]);

  const deptDistribution = useMemo(() => {
    const map = new Map<string, number>();
    activeEmployees.forEach((e) => {
      map.set(e.department, (map.get(e.department) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [activeEmployees]);

  const recentLeaveRequests = useMemo(() => {
    return [...requests].filter((r) => r.status === "Pending").slice(0, 5);
  }, [requests]);

  const getLeaveTypeName = (id: string) => leaveTypes.find((t) => t.id === id)?.name ?? id;
  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const birthdaysAndAnniversaries = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const items: { name: string; type: "Birthday" | "Anniversary"; date: string }[] = [];
    activeEmployees.forEach((e) => {
      const dob = e.dob;
      const m = parseInt(dob.slice(5, 7), 10);
      const d = parseInt(dob.slice(8, 10), 10);
      const bdayThisYear = new Date(now.getFullYear(), m - 1, d);
      if (isWithinInterval(bdayThisYear, { start: weekStart, end: weekEnd })) {
        items.push({ name: e.name, type: "Birthday", date: format(bdayThisYear, "MMM d") });
      }
      const doj = parseISO(e.dateOfJoining);
      const annThisYear = new Date(now.getFullYear(), doj.getMonth(), doj.getDate());
      if (isWithinInterval(annThisYear, { start: weekStart, end: weekEnd })) {
        items.push({ name: e.name, type: "Anniversary", date: format(annThisYear, "MMM d") });
      }
    });
    return items.slice(0, 8);
  }, [activeEmployees]);

  const attendanceByStatus = useMemo(() => {
    const curMonth = format(new Date(), "yyyy-MM");
    const monthRecords = records.filter((r) => r.date.startsWith(curMonth));
    const byStatus: Record<string, number> = {};
    monthRecords.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    });
    return ["Present", "Absent", "Late", "On Leave", "Half Day"].map((s) => ({
      status: s,
      count: byStatus[s] ?? 0,
    }));
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          trend={joinedThisMonth > 0 ? `+${joinedThisMonth} this month` : undefined}
          icon={Users}
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          trend={`${attendancePct}% attendance`}
          icon={UserCheck}
        />
        <StatCard
          title="Open Positions"
          value={openPositions}
          trend={`${totalApplicants} applicants`}
          icon={Briefcase}
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves.length}
          trend="Awaiting approval"
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Monthly headcount trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={headcountByMonth}
              xAxisKey="month"
              lines={[{ dataKey: "count", name: "Employees" }]}
              height={260}
            />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Department distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={deptDistribution} height={260} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Recent leave requests</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeaveRequests.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No pending requests"
                description="All leave requests have been processed."
              />
            ) : (
              <div className="space-y-3">
                {recentLeaveRequests.map((lr) => (
                  <div
                    key={lr.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{getEmployeeName(lr.employeeId)}</p>
                      <p className="text-sm text-slate-500">
                        {getLeaveTypeName(lr.leaveTypeId)} · {lr.fromDate} to {lr.toDate} ({lr.days}d)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lr.status} />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          approveLeave(lr.id, "EMP001");
                          toast.success("Leave approved");
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          rejectLeave(lr.id);
                          toast.success("Leave rejected");
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">This week</CardTitle>
            <p className="text-sm text-slate-500">Birthdays & work anniversaries</p>
          </CardHeader>
          <CardContent>
            {birthdaysAndAnniversaries.length === 0 ? (
              <p className="text-sm text-slate-500">No birthdays or anniversaries this week.</p>
            ) : (
              <ul className="space-y-2">
                {birthdaysAndAnniversaries.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Gift className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{item.name}</span>
                    <span className="text-slate-500">— {item.type}</span>
                    <span className="text-slate-400">{item.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Attendance this month</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={attendanceByStatus}
              xAxisKey="status"
              bars={[{ dataKey: "count", name: "Days" }]}
              height={260}
            />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/employees/add">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Employee
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/payroll">
                <Banknote className="mr-2 h-4 w-4" />
                Run Payroll
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/recruitment">
                <Briefcase className="mr-2 h-4 w-4" />
                Post Job
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/reports">
                <BarChart2 className="mr-2 h-4 w-4" />
                Generate Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const session = useAuthStore((s) => s.session);
  const getTeam = useEmployeeStore((s) => s.getTeam);
  const employees = useEmployeeStore((s) => s.employees);
  const getTodayStatus = useAttendanceStore((s) => s.getTodayStatus);
  const requests = useLeaveStore((s) => s.requests);
  const leaveTypes = useLeaveStore((s) => s.leaveTypes);
  const goals = usePerformanceStore((s) => s.goals);

  const managerId = session?.employeeId ?? "";
  const team = getTeam(managerId);
  const teamIds = new Set(team.map((e) => e.id));

  const teamAttendanceToday = team.map((emp) => {
    const status = getTodayStatus(emp.id);
    return { emp, status };
  });

  const pendingTeamLeaves = requests.filter(
    (r) => r.status === "Pending" && teamIds.has(r.employeeId)
  );
  const getLeaveTypeName = (id: string) => leaveTypes.find((t) => t.id === id)?.name ?? id;
  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const teamGoals = goals.filter((g) => teamIds.has(g.employeeId));

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-base">My team — attendance today</CardTitle>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No team members"
              description="You have no direct reportees."
            />
          ) : (
            <div className="flex flex-wrap gap-4">
              {teamAttendanceToday.map(({ emp, status }) => (
                <div
                  key={emp.id}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 min-w-[100px]"
                >
                  <UserAvatar name={emp.name} className="h-10 w-10" />
                  <span className="text-sm font-medium truncate max-w-[90px]">{emp.name}</span>
                  <StatusBadge
                    status={status?.status ?? "Absent"}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Pending approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTeamLeaves.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No pending requests"
                description="No leave requests from your team awaiting approval."
              />
            ) : (
              <ul className="space-y-2">
                {pendingTeamLeaves.slice(0, 5).map((lr) => (
                  <li
                    key={lr.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <span className="font-medium">{getEmployeeName(lr.employeeId)}</span>
                    <span className="text-slate-500">
                      {getLeaveTypeName(lr.leaveTypeId)} · {lr.days}d
                    </span>
                    <Button size="sm" asChild>
                      <Link href="/leave">Review</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Team goals progress</CardTitle>
          </CardHeader>
          <CardContent>
            {teamGoals.length === 0 ? (
              <p className="text-sm text-slate-500">No goals set for your team yet.</p>
            ) : (
              <div className="space-y-4">
                {teamGoals.slice(0, 5).map((g) => (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate mr-2">{g.title}</span>
                      <span className="text-slate-500">{g.progress}%</span>
                    </div>
                    <Progress value={g.progress} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-base">My team</CardTitle>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <EmptyState icon={Users} title="No team" description="You have no direct reportees." />
          ) : (
            <div className="flex flex-wrap gap-3">
              {team.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/employees/${emp.id}`}
                  className="flex items-center gap-2 rounded-lg border p-3 hover:bg-slate-50 transition-colors min-w-[180px]"
                >
                  <UserAvatar name={emp.name} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                  </div>
                  <StatusBadge status={emp.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeDashboard() {
  const session = useAuthStore((s) => s.session);
  const getMonthly = useAttendanceStore((s) => s.getMonthly);
  const balances = useLeaveStore((s) => s.balances);
  const leaveTypes = useLeaveStore((s) => s.leaveTypes);
  const getPayslipsForEmployee = usePayrollStore((s) => s.getPayslipsForEmployee);
  const goals = usePerformanceStore((s) => s.goals);

  const employeeId = session?.employeeId ?? "";
  const now = new Date();
  const monthRecords = getMonthly(employeeId, now.getFullYear(), now.getMonth() + 1);

  const myBalances = balances.filter((b) => b.employeeId === employeeId);
  const balanceWithName = myBalances.map((b) => {
    const lt = leaveTypes.find((t) => t.id === b.leaveTypeId);
    return { ...b, name: lt?.name ?? b.leaveTypeId };
  });

  const upcomingHolidays = useMemo(() => {
    const today = format(now, "yyyy-MM-dd");
    return HOLIDAYS.filter((h) => h.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, []);

  const payslips = getPayslipsForEmployee(employeeId);
  const recentPayslip = payslips.length > 0 ? payslips[payslips.length - 1] : null;

  const myGoals = goals.filter((g) => g.employeeId === employeeId);

  const presentCount = monthRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
  const leaveCount = monthRecords.filter((r) => r.status === "On Leave").length;
  const absentCount = monthRecords.filter((r) => r.status === "Absent").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Attendance this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{presentCount} days</p>
            <p className="text-xs text-slate-500 mt-1">
              Present · {leaveCount} on leave · {absentCount} absent
            </p>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {monthRecords.slice(0, 28).map((r, i) => (
                <div
                  key={i}
                  className="h-6 rounded border text-[10px] flex items-center justify-center"
                  title={`${r.date}: ${r.status}`}
                  style={{
                    backgroundColor:
                      r.status === "Present" || r.status === "Late"
                        ? "#10B981"
                        : r.status === "On Leave"
                          ? "#2563EB"
                          : r.status === "Weekend" || r.status === "Holiday"
                            ? "#e2e8f0"
                            : "#FEE2E2",
                  }}
                >
                  {r.date.slice(8, 10)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Leave balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {balanceWithName.length === 0 ? (
                <p className="text-sm text-slate-500">No leave balance data.</p>
              ) : (
                balanceWithName.slice(0, 5).map((b) => (
                  <div key={b.leaveTypeId} className="rounded-lg border p-3 min-w-[100px]">
                    <p className="text-xs text-slate-500">{b.name}</p>
                    <p className="text-xl font-semibold">{b.balance}</p>
                    <p className="text-xs text-slate-400">of {b.used + b.balance} days</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Upcoming holidays</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming holidays.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingHolidays.map((h) => (
                  <li key={h.id} className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{h.name}</span>
                    <span className="text-slate-500">{format(parseISO(h.date), "MMM d, yyyy")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Recent payslip</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayslip ? (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-slate-500">{recentPayslip.month}</p>
                <p className="text-2xl font-semibold">
                  ₹{recentPayslip.netSalary.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-400 mt-1">Net salary</p>
                <Button size="sm" className="mt-3" asChild>
                  <Link href="/payroll/payslips">View all</Link>
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={Banknote}
                title="No payslips"
                description="Your payslips will appear here once processed."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-base">My goals</CardTitle>
        </CardHeader>
        <CardContent>
          {myGoals.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No goals"
              description="Your manager will set goals for this cycle."
            />
          ) : (
            <div className="space-y-4">
              {myGoals.map((g) => (
                <div key={g.id} className="rounded-lg border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{g.title}</p>
                    <StatusBadge status={g.status} />
                  </div>
                  <Progress value={g.progress} className="h-2 mb-2" />
                  <p className="text-sm text-slate-500">Due: {format(parseISO(g.deadline), "MMM d, yyyy")}</p>
                </div>
              ))}
              <Button size="sm" variant="outline" asChild>
                <Link href="/performance">View all</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const session = useAuthStore((s) => s.session);

  if (!session) return null;

  if (session.role === "hr") return <HRDashboard />;
  if (session.role === "manager") return <ManagerDashboard />;
  return <EmployeeDashboard />;
}
