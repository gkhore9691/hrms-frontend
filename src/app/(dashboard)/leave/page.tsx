"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { CalendarDays, Send, Calendar } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useLeaveStore } from "@/stores/leaveStore";
import { useHolidayStore } from "@/stores/holidayStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, getWorkingDays } from "@/lib/formatters";

const applySchema = z.object({
  leaveTypeId: z.string().min(1, "Select leave type"),
  fromDate: z.string().min(1, "From date required"),
  toDate: z.string().min(1, "To date required"),
  reason: z.string().min(3, "Reason required"),
}).refine((data) => data.fromDate <= data.toDate, {
  message: "To date must be on or after from date",
  path: ["toDate"],
});

type ApplyValues = z.infer<typeof applySchema>;

const policySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  totalDays: z.number().min(0),
  carryForward: z.boolean(),
});

type PolicyValues = z.infer<typeof policySchema>;

export default function LeavePage() {
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? "";
  const getTeam = useEmployeeStore((s) => s.getTeam);
  const getById = useEmployeeStore((s) => s.getById);
  const leaveTypes = useLeaveStore((s) => s.leaveTypes);
  const balances = useLeaveStore((s) => s.balances);
  const requests = useLeaveStore((s) => s.requests);
  const getBalance = useLeaveStore((s) => s.getBalance);
  const applyLeave = useLeaveStore((s) => s.applyLeave);
  const approveLeave = useLeaveStore((s) => s.approveLeave);
  const rejectLeave = useLeaveStore((s) => s.rejectLeave);
  const cancelLeave = useLeaveStore((s) => s.cancelLeave);
  const updateLeaveType = useLeaveStore((s) => s.updateLeaveType);
  const holidays = useHolidayStore((s) => s.holidays);

  const holidayDates = useMemo(() => holidays.map((h) => h.date), [holidays]);

  const [policyEditId, setPolicyEditId] = useState<string | null>(null);

  const applyForm = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { leaveTypeId: "", fromDate: "", toDate: "", reason: "" },
  });

  const policyForm = useForm<PolicyValues>({
    resolver: zodResolver(policySchema),
    defaultValues: { name: "", code: "", totalDays: 0, carryForward: false },
  });

  const myRequests = useMemo(
    () => requests.filter((r) => r.employeeId === employeeId),
    [requests, employeeId]
  );

  const teamIds = useMemo(() => {
    if (session?.role !== "manager" || !session?.employeeId) return new Set<string>();
    return new Set(getTeam(session.employeeId).map((e) => e.id));
  }, [session?.role, session?.employeeId, getTeam]);

  const pendingForTeamOrAll = useMemo(() => {
    const pending = requests.filter((r) => r.status === "Pending");
    if (session?.role === "hr") return pending;
    if (session?.role === "manager") return pending.filter((r) => teamIds.has(r.employeeId));
    return [];
  }, [requests, session?.role, teamIds]);

  const balanceForEmployee = useMemo(() => {
    return leaveTypes.map((t) => {
      const { used, balance } = getBalance(employeeId, t.id);
      return { type: t, used, balance };
    }).filter((b) => b.type.totalDays > 0 || b.balance > 0);
  }, [leaveTypes, employeeId, getBalance]);

  const onApplySubmit = applyForm.handleSubmit((data) => {
    const days = getWorkingDays(data.fromDate, data.toDate, holidayDates);
    if (days <= 0) {
      applyForm.setError("toDate", { message: "No working days in range (check weekends/holidays)" });
      return;
    }
    const { balance } = getBalance(employeeId, data.leaveTypeId);
    if (days > balance) {
      applyForm.setError("leaveTypeId", { message: `Insufficient balance (${balance} days)` });
      return;
    }
    applyLeave({
      employeeId,
      leaveTypeId: data.leaveTypeId,
      fromDate: data.fromDate,
      toDate: data.toDate,
      days,
      reason: data.reason,
    });
    toast.success("Leave applied");
    applyForm.reset({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" });
  });

  const openPolicyEdit = (type: (typeof leaveTypes)[0]) => {
    setPolicyEditId(type.id);
    policyForm.reset({
      name: type.name,
      code: type.code,
      totalDays: type.totalDays,
      carryForward: type.carryForward,
    });
  };

  const onPolicySubmit = policyForm.handleSubmit((data) => {
    if (!policyEditId) return;
    updateLeaveType(policyEditId, data);
    toast.success("Policy updated");
    setPolicyEditId(null);
  });

  const teamLeaveCalendarData = useMemo(() => {
    const team = session?.role === "manager" && session?.employeeId
      ? getTeam(session.employeeId)
      : session?.role === "hr"
        ? useEmployeeStore.getState().employees
        : [];
    const approved = requests.filter((r) => r.status === "Approved");
    const byDate: Record<string, { employeeId: string; name: string; type: string }[]> = {};
    team.forEach((emp) => {
      approved
        .filter((r) => r.employeeId === emp.id)
        .forEach((r) => {
          const type = leaveTypes.find((t) => t.id === r.leaveTypeId);
          const from = new Date(r.fromDate);
          const to = new Date(r.toDate);
          eachDayOfInterval({ start: from, end: to }).forEach((d) => {
            const key = format(d, "yyyy-MM-dd");
            if (!byDate[key]) byDate[key] = [];
            byDate[key].push({
              employeeId: emp.id,
              name: emp.name,
              type: type?.code ?? r.leaveTypeId,
            });
          });
        });
    });
    return byDate;
  }, [session?.role, session?.employeeId, getTeam, requests, leaveTypes]);

  const visibleTabs = useMemo(() => {
    const t: { id: string; label: string }[] = [
      { id: "apply", label: "Apply Leave" },
      { id: "my", label: "My Leaves" },
    ];
    if (session?.role === "manager" || session?.role === "hr") {
      t.push({ id: "team", label: "Team Leaves" });
    }
    if (session?.role === "hr") {
      t.push({ id: "policies", label: "Leave Policies" });
    }
    return t;
  }, [session?.role]);

  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description={
          session.role === "hr"
            ? "Manage leave requests and policies"
            : "Apply and track your leave"
        }
      />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href="/leave/holidays">
            <Calendar className="mr-1 h-4 w-4" />
            Holiday calendar
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="apply" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="apply" className="space-y-6">
          <Card className="rounded-xl shadow-sm max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-5 w-5" />
                Apply for leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...applyForm}>
                <form onSubmit={onApplySubmit} className="space-y-4">
                  <FormField
                    control={applyForm.control}
                    name="leaveTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leaveTypes.filter((t) => t.totalDays > 0).map((t) => {
                              const { balance } = getBalance(employeeId, t.id);
                              return (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name} ({t.code}) — Balance: {balance} days
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={applyForm.control}
                      name="fromDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={applyForm.control}
                      name="toDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={applyForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balanceForEmployee.map((b) => (
              <Card key={b.type.id} className="rounded-xl shadow-sm">
                <CardContent className="pt-6">
                  <div
                    className="h-2 rounded-full bg-slate-100"
                    style={{
                      backgroundColor: `${b.type.color}20`,
                    }}
                  >
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(b.used / (b.type.totalDays || 1)) * 100}%`,
                        backgroundColor: b.type.color,
                      }}
                    />
                  </div>
                  <p className="mt-2 font-medium">{b.type.name}</p>
                  <p className="text-sm text-slate-500">
                    {b.used} / {b.type.totalDays} used · {b.balance} balance
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Leave history</CardTitle>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No leave requests"
                  description="Apply for leave using the Apply Leave tab."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRequests.map((r) => {
                      const type = leaveTypes.find((t) => t.id === r.leaveTypeId);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{type?.name ?? r.leaveTypeId}</TableCell>
                          <TableCell>{formatDate(r.fromDate)}</TableCell>
                          <TableCell>{formatDate(r.toDate)}</TableCell>
                          <TableCell>{r.days}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell>
                            {r.status === "Pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  cancelLeave(r.id);
                                  toast.success("Leave cancelled");
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Pending approval</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingForTeamOrAll.length === 0 ? (
                <p className="text-sm text-slate-500">No pending requests.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingForTeamOrAll.map((r) => {
                      const emp = getById(r.employeeId);
                      const type = leaveTypes.find((t) => t.id === r.leaveTypeId);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{emp?.name ?? r.employeeId}</TableCell>
                          <TableCell>{type?.name ?? r.leaveTypeId}</TableCell>
                          <TableCell>{formatDate(r.fromDate)} – {formatDate(r.toDate)}</TableCell>
                          <TableCell>{r.days}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="mr-2"
                              onClick={() => {
                                approveLeave(r.id, session.employeeId!);
                                toast.success("Approved");
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                rejectLeave(r.id);
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

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Team leave calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid min-w-[600px] grid-cols-7 gap-1 text-center text-xs">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="font-medium text-slate-500">
                      {d}
                    </div>
                  ))}
                  {(() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    const days = eachDayOfInterval({ start, end });
                    const pad = start.getDay() === 0 ? 6 : start.getDay() - 1;
                    return (
                      <>
                        {Array.from({ length: pad }).map((_, i) => (
                          <div key={`pad-${i}`} />
                        ))}
                        {days.map((d) => {
                          const key = format(d, "yyyy-MM-dd");
                          const list = teamLeaveCalendarData[key] ?? [];
                          return (
                            <div
                              key={key}
                              className="rounded border border-slate-100 bg-slate-50/50 p-1 min-h-[60px]"
                            >
                              <span className="text-slate-600">{format(d, "d")}</span>
                              {list.slice(0, 3).map((x) => (
                                <div
                                  key={`${x.employeeId}-${key}`}
                                  className="mt-0.5 truncate rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-800"
                                  title={`${x.name} (${x.type})`}
                                >
                                  {x.name} ({x.type})
                                </div>
                              ))}
                              {list.length > 3 && (
                                <div className="text-[10px] text-slate-400">+{list.length - 3}</div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Leave policies</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Total days</TableHead>
                    <TableHead>Carry forward</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.code}</TableCell>
                      <TableCell>{t.totalDays}</TableCell>
                      <TableCell>{t.carryForward ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Dialog
                          open={policyEditId === t.id}
                          onOpenChange={(open) => !open && setPolicyEditId(null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openPolicyEdit(t)}>
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit policy</DialogTitle>
                            </DialogHeader>
                            <Form {...policyForm}>
                              <form onSubmit={onPolicySubmit} className="space-y-4">
                                <FormField
                                  control={policyForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={policyForm.control}
                                  name="code"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Code</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={policyForm.control}
                                  name="totalDays"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Total days</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          {...field}
                                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={policyForm.control}
                                  name="carryForward"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={field.value}
                                          onChange={(e) => field.onChange(e.target.checked)}
                                          className="rounded border-slate-300"
                                        />
                                      </FormControl>
                                      <FormLabel className="!mt-0">Carry forward</FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setPolicyEditId(null)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit">Save</Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
