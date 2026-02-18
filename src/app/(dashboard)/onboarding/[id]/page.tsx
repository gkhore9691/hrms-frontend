"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { formatDate } from "@/lib/formatters";
import type { OnboardingTask } from "@/types";

const POLICY_TEXT = `By clicking "I Accept", you acknowledge that you have read and agree to:
• Company Code of Conduct
• IT Security and Data Privacy Policy
• Leave and Attendance Policy
• Confidentiality and Non-Disclosure Agreement

You understand that violation may result in disciplinary action.`;

const CATEGORIES = ["HR", "IT", "Finance", "Admin", "Compliance"];

const addTaskSchema = z.object({
  title: z.string().min(1, "Title required"),
  category: z.string().min(1, "Select category"),
  dueDate: z.string().min(1, "Due date required"),
});

type AddTaskValues = z.infer<typeof addTaskSchema>;

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date() && dueDate < new Date().toISOString().slice(0, 10);
}

export default function OnboardingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const checklistId = params.id as string;
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? "";
  const getTeam = useEmployeeStore((s) => s.getTeam);
  const getById = useEmployeeStore((s) => s.getById);
  const checklists = useOnboardingStore((s) => s.checklists);
  const completeTask = useOnboardingStore((s) => s.completeTask);
  const addTask = useOnboardingStore((s) => s.addTask);
  const getCompletionPercent = useOnboardingStore((s) => s.getCompletionPercent);

  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const checklist = useMemo(
    () => checklists.find((c) => c.id === checklistId),
    [checklists, checklistId]
  );

  const employee = useMemo(
    () => (checklist ? getById(checklist.employeeId) : undefined),
    [checklist, getById]
  );

  const canView = useMemo(() => {
    if (!session || !checklist) return false;
    if (session.role === "hr") return true;
    if (session.role === "manager" && session.employeeId) {
      const teamIds = new Set(getTeam(session.employeeId).map((e) => e.id));
      return teamIds.has(checklist.employeeId);
    }
    return checklist.employeeId === employeeId;
  }, [session, checklist, employeeId, getTeam]);

  const canComplete = checklist?.employeeId === employeeId;
  const isHR = session?.role === "hr";
  const percent = checklist ? getCompletionPercent(checklist.id) : 0;

  const tasksByCategory = useMemo(() => {
    if (!checklist) return {};
    const map: Record<string, OnboardingTask[]> = {};
    checklist.tasks.forEach((t) => {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    });
    CATEGORIES.forEach((cat) => {
      if (!map[cat]) map[cat] = [];
    });
    return map;
  }, [checklist]);

  const form = useForm<AddTaskValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: { title: "", category: "HR", dueDate: "" },
  });

  const onAddTask = form.handleSubmit((data) => {
    if (!checklistId) return;
    addTask(checklistId, {
      title: data.title,
      category: data.category,
      dueDate: data.dueDate,
      status: "Pending",
      completedOn: null,
    });
    toast.success("Task added");
    setAddTaskOpen(false);
    form.reset({ title: "", category: "HR", dueDate: "" });
  });

  const allDone = checklist && checklist.tasks.length > 0 && checklist.tasks.every((t) => t.status === "Done");

  if (!checklist) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/onboarding"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
        </Button>
        <EmptyState icon={Check} title="Checklist not found" description="" />
      </div>
    );
  }

  if (!canView) {
    router.replace("/onboarding");
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/onboarding"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
        </Button>
      </div>

      <PageHeader
        title="Onboarding checklist"
        description={employee ? `${employee.name} · ${employee.department}` : checklist.employeeId}
      />

      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Employee</p>
              <p className="font-display text-lg font-semibold text-slate-900">{employee?.name ?? checklist.employeeId}</p>
              <p className="text-sm text-slate-600">{employee?.department ?? "—"}</p>
              <p className="text-sm text-slate-500">DOJ: {employee ? formatDate(employee.dateOfJoining) : "—"}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${percent}, 100`}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{percent}%</p>
                <p className="text-sm text-slate-500">Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {allDone && (
        <Card className="rounded-xl border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-4">
            <p className="font-medium text-emerald-800">All tasks completed. Onboarding is done!</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-slate-900">Tasks by category</h2>
        {isHR && (
          <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
            <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add task
            </Button>
            <DialogContent>
              <DialogHeader><DialogTitle>Add task</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={onAddTask} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem><FormLabel>Due date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-6">
        {CATEGORIES.map((category) => {
          const tasks = tasksByCategory[category];
          if (!tasks || tasks.length === 0) return null;
          return (
            <Card key={category} className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.map((task) => {
                  if (task.title === "Policy Acceptance") {
                    if (task.status === "Done") {
                      return (
                        <div
                          key={task.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-white">
                              <Check className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{task.title}</p>
                              <p className="text-xs text-slate-500">Done {task.completedOn && formatDate(task.completedOn)}</p>
                            </div>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                      );
                    }
                    return (
                      <div key={task.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                        <p className="mb-2 font-medium text-slate-900">Policy Acceptance</p>
                        <p className={`mb-2 text-xs ${isOverdue(task.dueDate) ? "text-red-600" : "text-slate-500"}`}>Due {formatDate(task.dueDate)}</p>
                        <p className="mb-4 whitespace-pre-wrap text-sm text-slate-600">{POLICY_TEXT}</p>
                        {canComplete && (
                          <Button
                            size="sm"
                            onClick={() => {
                              completeTask(checklist.id, task.id);
                              toast.success("Policy accepted");
                            }}
                          >
                            I Accept
                          </Button>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={task.id}
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${isOverdue(task.dueDate) && task.status !== "Done" ? "border-red-200 bg-red-50/50" : "border-slate-200"}`}
                    >
                      <div className="flex items-center gap-3">
                        {canComplete && task.status === "Pending" && (
                          <button
                            type="button"
                            onClick={() => {
                              completeTask(checklist.id, task.id);
                              toast.success("Task marked done");
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 hover:bg-slate-100"
                            aria-label="Mark done"
                          >
                            <Check className="h-4 w-4 text-slate-400" />
                          </button>
                        )}
                        {task.status === "Done" && (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <p className={`text-xs ${isOverdue(task.dueDate) && task.status !== "Done" ? "text-red-600" : "text-slate-500"}`}>
                            Due {formatDate(task.dueDate)}
                            {task.status === "Done" && task.completedOn && ` · Done ${formatDate(task.completedOn)}`}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
