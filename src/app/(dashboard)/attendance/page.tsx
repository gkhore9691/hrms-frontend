"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock, Download, UserCheck, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useLeaveStore } from "@/stores/leaveStore";
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
import { EmptyState } from "@/components/common/EmptyState";
import { DEPARTMENTS } from "@/data/dummyData";
import { HOLIDAYS } from "@/data/dummyData";
import { formatDate } from "@/lib/formatters";
import type { AttendanceStatus } from "@/types";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: "bg-emerald-500",
  Absent: "bg-red-500",
  "Half Day": "bg-amber-400",
  Late: "bg-amber-500",
  "On Leave": "bg-blue-500",
  Holiday: "bg-slate-400",
  Weekend: "bg-slate-300",
};

function getDayStatus(
  dateStr: string,
  record: { status: AttendanceStatus } | null,
  isWeekend: boolean,
  isHoliday: boolean,
  isOnLeave: boolean
): AttendanceStatus {
  if (isHoliday) return "Holiday";
  if (isWeekend) return "Weekend";
  if (isOnLeave) return "On Leave";
  if (record) return record.status;
  return "Absent";
}

function isDateInRange(dateStr: string, from: string, to: string): boolean {
  return dateStr >= from && dateStr <= to;
}

function calcHoursSoFar(checkIn: string | null | undefined): number {
  if (!checkIn || typeof checkIn !== "string") return 0;
  const parts = checkIn.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
  return Math.max(0, Math.round((mins / 60) * 100) / 100);
}

export default function AttendancePage() {
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? "";
  const getTeam = useEmployeeStore((s) => s.getTeam);
  const getById = useEmployeeStore((s) => s.getById);
  const employees = useEmployeeStore((s) => s.employees);
  const records = useAttendanceStore((s) => s.records);
  const regularizations = useAttendanceStore((s) => s.regularizations);
  const checkIn = useAttendanceStore((s) => s.checkIn);
  const checkOut = useAttendanceStore((s) => s.checkOut);
  const getTodayStatus = useAttendanceStore((s) => s.getTodayStatus);
  const getMonthly = useAttendanceStore((s) => s.getMonthly);
  const approveRegularization = useAttendanceStore((s) => s.approveRegularization);
  const rejectRegularization = useAttendanceStore((s) => s.rejectRegularization);
  const leaveRequests = useLeaveStore((s) => s.requests);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [hrDept, setHrDept] = useState<string>("all");
  const [hrDateFrom, setHrDateFrom] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [hrDateTo, setHrDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const todayStatus = getTodayStatus(employeeId);
  const monthRecords = getMonthly(employeeId, calendarMonth.year, calendarMonth.month);
  const approvedLeavesForEmployee = useMemo(
    () =>
      leaveRequests.filter(
        (r) => r.employeeId === employeeId && r.status === "Approved"
      ),
    [leaveRequests, employeeId]
  );

  const holidaySet = useMemo(
    () => new Set(HOLIDAYS.map((h) => h.date)),
    []
  );

  const calendarDays = useMemo(() => {
    const year = calendarMonth.year;
    const month = calendarMonth.month;
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    const days: { date: string; day: number; status: AttendanceStatus }[] = [];
    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(dateStr);
      const rec = monthRecords.find((r) => r.date === dateStr) ?? null;
      const isOnLeave = approvedLeavesForEmployee.some((r) =>
        isDateInRange(dateStr, r.fromDate, r.toDate)
      );
      days.push({
        date: dateStr,
        day: d,
        status: getDayStatus(dateStr, rec, isWeekend, isHoliday, isOnLeave),
      });
    }
    return days;
  }, [calendarMonth, monthRecords, holidaySet, approvedLeavesForEmployee]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    calendarDays.forEach((d) => {
      if (d.status === "Present") present++;
      else if (d.status === "Absent") absent++;
      else if (d.status === "Late") late++;
      else if (d.status === "On Leave") leave++;
    });
    return { present, absent, late, leave };
  }, [calendarDays]);

  const teamMembers = session?.role === "manager" && session?.employeeId ? getTeam(session.employeeId) : [];
  const pendingRegs = useMemo(
    () => regularizations.filter((r) => r.status === "Pending"),
    [regularizations]
  );
  const pendingRegsForManager = useMemo(() => {
    if (session?.role !== "manager" || !session?.employeeId) return [];
    const teamIds = new Set(teamMembers.map((e) => e.id));
    return pendingRegs.filter((r) => teamIds.has(r.employeeId));
  }, [pendingRegs, teamMembers, session?.role, session?.employeeId]);

  const hrFilteredEmployees = useMemo(() => {
    if (hrDept === "all") return employees;
    return employees.filter((e) => e.department === hrDept);
  }, [employees, hrDept]);

  const hrTableRows = useMemo(() => {
    const rows: { employeeId: string; date: string; record: (typeof records)[0] }[] = [];
    hrFilteredEmployees.forEach((emp) => {
      const empRecords = records.filter(
        (r) => r.employeeId === emp.id && r.date >= hrDateFrom && r.date <= hrDateTo
      );
      empRecords.forEach((rec) => {
        rows.push({ employeeId: emp.id, date: rec.date, record: rec });
      });
    });
    return rows.sort((a, b) => a.date.localeCompare(b.date) || a.employeeId.localeCompare(b.employeeId));
  }, [hrFilteredEmployees, records, hrDateFrom, hrDateTo]);

  if (!session) return null;

  const handleExport = () => {
    toast.success("Report exported");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance"
        description={
          session.role === "hr"
            ? "View and manage organization attendance"
            : session.role === "manager"
              ? "Team attendance and regularization"
              : "Your attendance and check-in"
        }
      />

      {/* ─── Employee view ───────────────────────────────────────────────────── */}
      {(session.role === "employee" || session.role === "manager") && employeeId && (
        <>
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-semibold text-slate-900">
                {format(new Date(), "HH:mm")}
              </p>
              {!todayStatus ? (
                <Button onClick={() => checkIn(employeeId)}>Check In</Button>
              ) : todayStatus.checkOut ? (
                <p className="text-slate-600">
                  Worked {todayStatus.hoursWorked}h today
                </p>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">
                    {todayStatus.checkIn ? (
                      <>Checked in at {todayStatus.checkIn} · {calcHoursSoFar(todayStatus.checkIn)}h so far</>
                    ) : (
                      "Checked in · Calculating…"
                    )}
                  </span>
                  <Button onClick={() => checkOut(employeeId)}>Check Out</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarIcon className="h-5 w-5" />
                My Attendance
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCalendarMonth((p) =>
                      p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 }
                    )
                  }
                >
                  Prev
                </Button>
                <span className="flex items-center px-2 text-sm font-medium">
                  {format(new Date(calendarMonth.year, calendarMonth.month - 1), "MMMM yyyy")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCalendarMonth((p) =>
                      p.month === 12 ? { year: p.year + 1, month: 1 } : { year: p.year, month: p.month + 1 }
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="font-medium text-slate-500">
                    {d}
                  </div>
                ))}
                {Array.from({ length: new Date(calendarMonth.year, calendarMonth.month - 1, 1).getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {calendarDays.map((d) => (
                  <div
                    key={d.date}
                    className={`rounded-md py-1.5 text-xs font-medium text-white ${STATUS_COLORS[d.status]}`}
                    title={d.status}
                  >
                    {d.day}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" /> Present {summary.present}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500" /> Absent {summary.absent}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500" /> Late {summary.late}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-blue-500" /> Leave {summary.leave}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Manager: Team attendance today + regularization ──────────────────── */}
      {session.role === "manager" && session.employeeId && (
        <>
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Team Attendance Today</CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="No team members"
                  description="You have no direct reports."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((emp) => {
                      const rec = getTodayStatus(emp.id);
                      return (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell>{rec?.checkIn ?? "—"}</TableCell>
                          <TableCell>{rec?.status ?? "—"}</TableCell>
                          <TableCell>{rec?.checkOut ? `${rec.hoursWorked}h` : rec?.checkIn ? `${calcHoursSoFar(rec.checkIn)}h` : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Pending Regularization</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRegsForManager.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  title="No pending requests"
                  description="No regularization requests from your team."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRegsForManager.map((reg) => {
                      const emp = getById(reg.employeeId);
                      return (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{emp?.name ?? reg.employeeId}</TableCell>
                          <TableCell>{formatDate(reg.date)}</TableCell>
                          <TableCell>{reg.reason}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="default"
                              className="mr-2"
                              onClick={() => {
                                approveRegularization(reg.id, session.employeeId!);
                                toast.success("Approved");
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                rejectRegularization(reg.id, session.employeeId!);
                                toast.success("Rejected");
                              }}
                            >
                              Reject
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

      {/* ─── HR: Full table + filters + regularization ─────────────────────── */}
      {session.role === "hr" && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href="/attendance/shifts">
                <Settings className="mr-1 h-4 w-4" />
                Shift management
              </Link>
            </Button>
          </div>
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-base">Attendance Records</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={hrDept} onValueChange={setHrDept}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="date"
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={hrDateFrom}
                  onChange={(e) => setHrDateFrom(e.target.value)}
                />
                <input
                  type="date"
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={hrDateTo}
                  onChange={(e) => setHrDateTo(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-1 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hrTableRows.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  title="No records"
                  description="No attendance records in the selected range."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hrTableRows.map(({ employeeId: eid, date, record }) => {
                        const emp = getById(eid);
                        return (
                          <TableRow key={`${eid}-${date}`}>
                            <TableCell className="font-medium">{emp?.name ?? eid}</TableCell>
                            <TableCell>{formatDate(date)}</TableCell>
                            <TableCell>{record.checkIn ?? "—"}</TableCell>
                            <TableCell>{record.checkOut ?? "—"}</TableCell>
                            <TableCell>{record.status}</TableCell>
                            <TableCell>{record.checkOut ? `${record.hoursWorked}h` : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Regularization Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRegs.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  title="No pending requests"
                  description="No regularization requests to review."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRegs.map((reg) => {
                      const emp = getById(reg.employeeId);
                      return (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{emp?.name ?? reg.employeeId}</TableCell>
                          <TableCell>{formatDate(reg.date)}</TableCell>
                          <TableCell>{reg.reason}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="default"
                              className="mr-2"
                              onClick={() => {
                                approveRegularization(reg.id, session.employeeId!);
                                toast.success("Approved");
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                rejectRegularization(reg.id, session.employeeId!);
                                toast.success("Rejected");
                              }}
                            >
                              Reject
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
