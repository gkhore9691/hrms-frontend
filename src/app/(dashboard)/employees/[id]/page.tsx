"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar, Briefcase, FileText, Clock, CalendarDays, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useAttendanceStore } from "@/stores/attendanceStore";
import { useLeaveStore } from "@/stores/leaveStore";
import { usePerformanceStore } from "@/stores/performanceStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RoleGuard } from "@/components/common/RoleGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { canAccess } from "@/lib/permissions";
import type { Employee } from "@/types";

const TAB_IDS = ["overview", "personal", "job", "documents", "attendance", "leave", "performance"] as const;

export default function EmployeeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;

  const session = useAuthStore((s) => s.session);
  const employee = useEmployeeStore((s) => s.getById(id));
  const getById = useEmployeeStore((s) => s.getById);
  const getTeam = useEmployeeStore((s) => s.getTeam);

  useEffect(() => {
    if (!session) return;
    if (!employee) {
      router.replace("/employees");
      return;
    }
    const isOwn = session.employeeId === id;
    const isHR = session.role === "hr";
    const isManager = session.role === "manager" && getTeam(session.employeeId).some((e) => e.id === id);
    if (!isOwn && !isHR && !isManager) {
      router.replace("/dashboard");
      return;
    }
  }, [id, session, employee, getTeam, router]);

  const defaultTab = searchParams.get("tab") ?? "overview";
  const tabIndex = TAB_IDS.includes(defaultTab as (typeof TAB_IDS)[number])
    ? defaultTab
    : "overview";

  if (!session) return null;
  if (!employee) return null;

  const directReports = getTeam(employee.id);
  const isHR = session.role === "hr";
  const showSalary = isHR && canAccess(session.role, "payroll.view");

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.name}
        description={`${employee.designation} · ${employee.department}`}
      />

      <Tabs defaultValue={tabIndex} className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 bg-slate-100 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Briefcase className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="personal" className="gap-1.5">
            <FileText className="h-4 w-4" /> Personal
          </TabsTrigger>
          <TabsTrigger value="job" className="gap-1.5">
            <MapPin className="h-4 w-4" /> Job & Salary
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" /> Documents
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <Clock className="h-4 w-4" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Leave
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab employee={employee} getById={getById} directReports={directReports} />
        </TabsContent>
        <TabsContent value="personal">
          <PersonalTab employee={employee} />
        </TabsContent>
        <TabsContent value="job">
          <JobSalaryTab employee={employee} showSalary={showSalary} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab employee={employee} />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab employeeId={employee.id} />
        </TabsContent>
        <TabsContent value="leave">
          <LeaveTab employeeId={employee.id} />
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceTab employeeId={employee.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({
  employee,
  getById,
  directReports,
}: {
  employee: Employee;
  getById: (id: string) => Employee | undefined;
  directReports: Employee[];
}) {
  const tenureYears = Math.floor(
    (Date.now() - parseISO(employee.dateOfJoining).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const manager = employee.reportingManagerId ? getById(employee.reportingManagerId) : null;

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-6">
          <UserAvatar name={employee.name} className="h-20 w-20" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{employee.name}</h2>
              <StatusBadge status={employee.status} />
              <span className="text-slate-500 text-sm">{employee.id}</span>
            </div>
            <p className="text-slate-600 mt-1">{employee.designation} · {employee.department}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
              <span>Tenure: {tenureYears}+ years</span>
              <span>Location: {employee.workLocation}</span>
            </div>
            {employee.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {employee.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {manager && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Reporting manager</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/employees/${manager.id}`}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors"
              >
                <UserAvatar name={manager.name} />
                <div>
                  <p className="font-medium">{manager.name}</p>
                  <p className="text-sm text-slate-500">{manager.designation}</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Emergency contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{employee.emergencyContact.name}</p>
            <p className="text-sm text-slate-500">{employee.emergencyContact.relation}</p>
            <p className="text-sm text-slate-600">{employee.emergencyContact.phone}</p>
          </CardContent>
        </Card>
      </div>

      {directReports.length > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Direct reports ({directReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {directReports.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/employees/${emp.id}`}
                  className="flex items-center gap-2 rounded-lg border p-3 hover:bg-slate-50 min-w-[200px]"
                >
                  <UserAvatar name={emp.name} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PersonalTab({ employee }: { employee: Employee }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Personal information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Full name</p>
          <p className="font-medium">{employee.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Date of birth</p>
          <p className="font-medium">{formatDate(employee.dob)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Gender</p>
          <p className="font-medium">{employee.gender}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Blood group</p>
          <p className="font-medium">{employee.bloodGroup}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Phone</p>
          <p className="font-medium">{employee.phone}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="font-medium">{employee.email}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-slate-500">Address</p>
          <p className="font-medium">{employee.address}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function JobSalaryTab({ employee, showSalary }: { employee: Employee; showSalary: boolean }) {
  const s = employee.salary;
  const monthly = (key: keyof typeof s) =>
    key === "ctc" ? s.ctc / 12 : Math.round((s[key] as number) / 12);

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Job details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-sm text-slate-500">Department</p><p className="font-medium">{employee.department}</p></div>
          <div><p className="text-sm text-slate-500">Designation</p><p className="font-medium">{employee.designation}</p></div>
          <div><p className="text-sm text-slate-500">Work location</p><p className="font-medium">{employee.workLocation}</p></div>
          <div><p className="text-sm text-slate-500">Employment type</p><p className="font-medium">{employee.employmentType}</p></div>
          <div><p className="text-sm text-slate-500">Date of joining</p><p className="font-medium">{formatDate(employee.dateOfJoining)}</p></div>
        </CardContent>
      </Card>

      {showSalary && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Salary breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Component</th>
                    <th className="text-right py-2">Monthly (₹)</th>
                    <th className="text-right py-2">Annual (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="py-2">Basic</td><td className="text-right">{formatCurrency(monthly("basic"))}</td><td className="text-right">{formatCurrency(s.basic)}</td></tr>
                  <tr className="border-b"><td className="py-2">HRA</td><td className="text-right">{formatCurrency(monthly("hra"))}</td><td className="text-right">{formatCurrency(s.hra)}</td></tr>
                  <tr className="border-b"><td className="py-2">Allowances</td><td className="text-right">{formatCurrency(monthly("allowances"))}</td><td className="text-right">{formatCurrency(s.allowances)}</td></tr>
                  <tr className="border-b"><td className="py-2">PF</td><td className="text-right">{formatCurrency(monthly("pf"))}</td><td className="text-right">{formatCurrency(s.pf)}</td></tr>
                  <tr className="border-b"><td className="py-2">Tax</td><td className="text-right">{formatCurrency(monthly("tax"))}</td><td className="text-right">{formatCurrency(s.tax)}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-semibold">CTC: {formatCurrency(s.ctc)} per annum</p>
          </CardContent>
        </Card>
      )}

      {!showSalary && (
        <p className="text-sm text-slate-500">Salary information is visible only to HR.</p>
      )}
    </div>
  );
}

const DOC_TYPES = ["KYC", "HR", "IT", "Finance", "Other"];

function DocumentsTab({ employee }: { employee: Employee }) {
  const addDocument = useEmployeeStore((s) => s.addDocument);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("KYC");

  const handleUpload = () => {
    if (!docName.trim()) return;
    addDocument(employee.id, { name: docName.trim(), type: docType });
    toast.success("Document added");
    setDocName("");
    setDocType("KYC");
    setUploadOpen(false);
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Documents</CardTitle>
        <RoleGuard permission="employees.edit">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Upload document</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>Add document</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium">Document name</label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. Aadhaar Card"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={!docName.trim()}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </CardHeader>
      <CardContent>
        {employee.documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded.</p>
        ) : (
          <div className="space-y-2">
            {employee.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-slate-400" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.type} · {formatDate(doc.uploadedOn)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([`Document: ${doc.name}\nType: ${doc.type}\nUploaded: ${doc.uploadedOn}`], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${doc.name.replace(/\s+/g, "_")}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Download started");
                    }}
                  >
                    Download
                  </Button>
                  <StatusBadge status={doc.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttendanceTab({ employeeId }: { employeeId: string }) {
  const getMonthly = useAttendanceStore((s) => s.getMonthly);
  const now = new Date();
  const records = getMonthly(employeeId, now.getFullYear(), now.getMonth() + 1);
  const present = records.filter((r) => r.status === "Present" || r.status === "Late").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const onLeave = records.filter((r) => r.status === "On Leave").length;
  const late = records.filter((r) => r.status === "Late").length;

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Summary — {format(now, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <div><p className="text-sm text-slate-500">Present</p><p className="text-2xl font-semibold text-emerald-600">{present}</p></div>
          <div><p className="text-sm text-slate-500">Absent</p><p className="text-2xl font-semibold text-red-600">{absent}</p></div>
          <div><p className="text-sm text-slate-500">Late</p><p className="text-2xl font-semibold text-amber-600">{late}</p></div>
          <div><p className="text-sm text-slate-500">On leave</p><p className="text-2xl font-semibold text-blue-600">{onLeave}</p></div>
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {records.slice(0, 31).map((r, i) => (
              <div
                key={i}
                className="aspect-square rounded border flex items-center justify-center text-[10px]"
                title={`${r.date}: ${r.status}`}
                style={{
                  backgroundColor:
                    r.status === "Present" ? "#10B981" :
                    r.status === "Late" ? "#F59E0B" :
                    r.status === "On Leave" ? "#2563EB" :
                    r.status === "Absent" ? "#FEE2E2" : "#f1f5f9",
                }}
              >
                {r.date.slice(8, 10)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LeaveTab({ employeeId }: { employeeId: string }) {
  const balances = useLeaveStore((s) => s.balances);
  const requests = useLeaveStore((s) => s.requests);
  const leaveTypes = useLeaveStore((s) => s.leaveTypes);

  const myBalances = balances.filter((b) => b.employeeId === employeeId);
  const myRequests = requests.filter((r) => r.employeeId === employeeId).slice(0, 10);
  const getTypeName = (tid: string) => leaveTypes.find((t) => t.id === tid)?.name ?? tid;

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Leave balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {myBalances.map((b) => (
              <div key={b.leaveTypeId} className="rounded-lg border p-4 min-w-[120px]">
                <p className="text-sm text-slate-500">{getTypeName(b.leaveTypeId)}</p>
                <p className="text-2xl font-semibold">{b.balance}</p>
                <p className="text-xs text-slate-400">balance (used {b.used})</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Leave history</CardTitle>
        </CardHeader>
        <CardContent>
          {myRequests.length === 0 ? (
            <p className="text-sm text-slate-500">No leave requests.</p>
          ) : (
            <div className="space-y-2">
              {myRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{getTypeName(r.leaveTypeId)} · {r.fromDate} to {r.toDate} ({r.days}d)</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceTab({ employeeId }: { employeeId: string }) {
  const goals = usePerformanceStore((s) => s.goals);
  const reviews = usePerformanceStore((s) => s.reviews);

  const myGoals = goals.filter((g) => g.employeeId === employeeId);
  const myReview = reviews.find((r) => r.employeeId === employeeId);

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {myGoals.length === 0 ? (
            <p className="text-sm text-slate-500">No goals set.</p>
          ) : (
            <div className="space-y-4">
              {myGoals.map((g) => (
                <div key={g.id} className="rounded-lg border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{g.title}</p>
                    <StatusBadge status={g.status} />
                  </div>
                  <Progress value={g.progress} className="h-2" />
                  <p className="text-xs text-slate-500 mt-2">Due: {format(parseISO(g.deadline), "MMM d, yyyy")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {myReview && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Review status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Status: <StatusBadge status={myReview.status} /></p>
            {myReview.selfRating != null && <p className="text-sm mt-2">Self rating: {myReview.selfRating}/5</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
