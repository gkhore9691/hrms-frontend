"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Target, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { usePerformanceStore } from "@/stores/performanceStore";
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

const setGoalSchema = z.object({
  employeeId: z.string().min(1, "Select employee"),
  title: z.string().min(2, "Title required"),
  category: z.string().min(1, "Category required"),
  description: z.string().optional(),
  target: z.string().min(1, "Target required"),
  deadline: z.string().min(1, "Deadline required"),
  weightage: z.number().min(0).max(100),
});

const selfReviewSchema = z.object({
  selfRating: z.number().min(1).max(5),
  selfComments: z.string().optional(),
});

const managerReviewSchema = z.object({
  managerRating: z.number().min(1).max(5),
  managerComments: z.string().optional(),
});

const cycleSchema = z.object({
  name: z.string().min(2, "Name required"),
  type: z.string().min(1, "Type required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  status: z.string().min(1, "Status required"),
});

type SetGoalValues = z.infer<typeof setGoalSchema>;
type SelfReviewValues = z.infer<typeof selfReviewSchema>;
type ManagerReviewValues = z.infer<typeof managerReviewSchema>;
type CycleValues = z.infer<typeof cycleSchema>;

const GOAL_CATEGORIES = ["Project", "Learning", "Behavioural", "Stretch"];

export default function PerformancePage() {
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? "";
  const getTeam = useEmployeeStore((s) => s.getTeam);
  const getById = useEmployeeStore((s) => s.getById);
  const employees = useEmployeeStore((s) => s.employees);
  const cycles = usePerformanceStore((s) => s.cycles);
  const goals = usePerformanceStore((s) => s.goals);
  const reviews = usePerformanceStore((s) => s.reviews);
  const addGoal = usePerformanceStore((s) => s.addGoal);
  const submitSelfReview = usePerformanceStore((s) => s.submitSelfReview);
  const submitManagerReview = usePerformanceStore((s) => s.submitManagerReview);
  const finalizeRating = usePerformanceStore((s) => s.finalizeRating);
  const createCycle = usePerformanceStore((s) => s.createCycle);

  const [setGoalOpen, setSetGoalOpen] = useState(false);
  const [managerReviewId, setManagerReviewId] = useState<string | null>(null);
  const [finalizeReviewId, setFinalizeReviewId] = useState<string | null>(null);
  const [finalizeRatingVal, setFinalizeRatingVal] = useState(3);
  const [createCycleOpen, setCreateCycleOpen] = useState(false);

  const activeCycle = useMemo(() => cycles.find((c) => c.status === "Active") ?? cycles[0], [cycles]);

  const teamIds = useMemo(() => {
    if (session?.role !== "manager" || !session?.employeeId) return new Set<string>();
    return new Set(getTeam(session.employeeId).map((e) => e.id));
  }, [session?.role, session?.employeeId, getTeam]);

  const goalsForView = useMemo(() => {
    if (session?.role === "employee") return goals.filter((g) => g.employeeId === employeeId);
    if (session?.role === "manager") return goals.filter((g) => teamIds.has(g.employeeId));
    return goals;
  }, [goals, session?.role, employeeId, teamIds]);

  const pendingManagerReviews = useMemo(() => {
    if (session?.role !== "manager" && session?.role !== "hr") return [];
    const list = reviews.filter((r) => r.status === "Self Review Submitted");
    if (session?.role === "manager")
      return list.filter((r) => teamIds.has(r.employeeId));
    return list;
  }, [reviews, session?.role, teamIds]);

  const setGoalForm = useForm<SetGoalValues>({
    resolver: zodResolver(setGoalSchema),
    defaultValues: { employeeId: "", title: "", category: "Project", description: "", target: "", deadline: "", weightage: 20 },
  });

  const selfReviewForm = useForm<SelfReviewValues>({
    resolver: zodResolver(selfReviewSchema),
    defaultValues: { selfRating: 3, selfComments: "" },
  });

  const managerReviewForm = useForm<ManagerReviewValues>({
    resolver: zodResolver(managerReviewSchema),
    defaultValues: { managerRating: 3, managerComments: "" },
  });

  const cycleForm = useForm<CycleValues>({
    resolver: zodResolver(cycleSchema),
    defaultValues: { name: "", type: "Annual", startDate: "", endDate: "", status: "Active" },
  });

  const employeeOptions = useMemo(() => {
    if (session?.role === "hr") return employees;
    if (session?.role === "manager" && session?.employeeId)
      return employees.filter((e) => teamIds.has(e.id));
    return [];
  }, [session?.role, session?.employeeId, employees, teamIds]);

  const onSetGoal = setGoalForm.handleSubmit((data) => {
    if (!activeCycle) return;
    addGoal({
      employeeId: data.employeeId,
      cycleId: activeCycle.id,
      title: data.title,
      category: data.category,
      description: data.description ?? "",
      target: data.target,
      deadline: data.deadline,
      weightage: data.weightage,
      status: "In Progress",
      progress: 0,
      setBy: session?.employeeId ?? "EMP001",
      setOn: new Date().toISOString().slice(0, 10),
    });
    toast.success("Goal set");
    setSetGoalOpen(false);
    setGoalForm.reset();
  });

  const onSelfReview = selfReviewForm.handleSubmit((data) => {
    if (!activeCycle) return;
    submitSelfReview(employeeId, activeCycle.id, {
      selfRating: data.selfRating,
      selfComments: data.selfComments ?? "",
    });
    toast.success("Self review submitted");
    selfReviewForm.reset();
  });

  const onManagerReview = managerReviewForm.handleSubmit((data) => {
    if (!managerReviewId) return;
    submitManagerReview(managerReviewId, {
      managerRating: data.managerRating,
      managerComments: data.managerComments ?? "",
    });
    toast.success("Manager review submitted");
    setManagerReviewId(null);
    managerReviewForm.reset();
  });

  const onFinalize = () => {
    if (!finalizeReviewId) return;
    finalizeRating(finalizeReviewId, finalizeRatingVal);
    toast.success("Rating finalized");
    setFinalizeReviewId(null);
  };

  const onCreateCycle = cycleForm.handleSubmit((data) => {
    createCycle(data);
    toast.success("Cycle created");
    setCreateCycleOpen(false);
    cycleForm.reset();
  });

  const myReview = useMemo(
    () => (activeCycle ? reviews.find((r) => r.employeeId === employeeId && r.cycleId === activeCycle.id) : null),
    [reviews, employeeId, activeCycle]
  );

  const isHR = session?.role === "hr";
  const isManager = session?.role === "manager";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description="Goals, reviews, and cycles."
      />

      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          {isHR && <TabsTrigger value="cycles">Cycles</TabsTrigger>}
        </TabsList>

        <TabsContent value="goals" className="space-y-6">
          {(isHR || isManager) && (
            <div className="flex justify-end">
              <Dialog open={setGoalOpen} onOpenChange={setSetGoalOpen}>
                <Button size="sm" onClick={() => setSetGoalOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" /> Set Goal
                </Button>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Set goal</DialogTitle></DialogHeader>
                  <Form {...setGoalForm}>
                    <form onSubmit={onSetGoal} className="space-y-4">
                      <FormField control={setGoalForm.control} name="employeeId" render={({ field }) => (
                        <FormItem><FormLabel>Employee</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>{employeeOptions.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={setGoalForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={setGoalForm.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{GOAL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={setGoalForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={setGoalForm.control} name="target" render={({ field }) => (
                        <FormItem><FormLabel>Target</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={setGoalForm.control} name="deadline" render={({ field }) => (
                        <FormItem><FormLabel>Deadline</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={setGoalForm.control} name="weightage" render={({ field }) => (
                        <FormItem><FormLabel>Weightage (0–100)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <DialogFooter><Button type="button" variant="outline" onClick={() => setSetGoalOpen(false)}>Cancel</Button><Button type="submit">Set Goal</Button></DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {session?.role === "employee" ? (
            goalsForView.length === 0 ? (
              <EmptyState icon={Target} title="No goals" description="Your manager will set goals for you." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {goalsForView.map((g) => (
                  <Card key={g.id} className={`rounded-xl shadow-sm ${g.status === "At Risk" ? "border-amber-200" : g.status === "Completed" ? "border-emerald-200" : ""}`}>
                    <CardContent className="pt-6">
                      <p className="font-medium text-slate-900">{g.title}</p>
                      <p className="text-xs text-slate-500">{g.category} · Due {formatDate(g.deadline)}</p>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${g.progress}%` }} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{g.progress}%</p>
                      <StatusBadge status={g.status} className="mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            goalsForView.length === 0 ? (
              <EmptyState icon={Target} title="No goals" description="Set goals for your team." />
            ) : (
              <Card className="rounded-xl shadow-sm">
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Goal</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goalsForView.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{getById(g.employeeId)?.name ?? g.employeeId}</TableCell>
                          <TableCell>{g.title}</TableCell>
                          <TableCell>{g.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 rounded-full bg-slate-100">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${g.progress}%` }} />
                              </div>
                              <span className="text-sm">{g.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(g.deadline)}</TableCell>
                          <TableCell><StatusBadge status={g.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          {activeCycle && (
            <Card className="rounded-xl border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <p className="font-medium text-slate-900">Active cycle: {activeCycle.name}</p>
                <p className="text-sm text-slate-600">{activeCycle.type} · {formatDate(activeCycle.startDate)} – {formatDate(activeCycle.endDate)}</p>
              </CardContent>
            </Card>
          )}

          {session?.role === "employee" && (
            <Card className="rounded-xl shadow-sm">
              <CardHeader><CardTitle className="text-base">Self review</CardTitle></CardHeader>
              <CardContent>
                {!activeCycle ? (
                  <p className="text-sm text-slate-500">No active cycle.</p>
                ) : myReview?.status === "Self Review Submitted" ? (
                  <p className="text-sm text-slate-600">You have submitted your self review (Rating: {myReview.selfRating}).</p>
                ) : (
                  <Form {...selfReviewForm}>
                    <form onSubmit={onSelfReview} className="space-y-4 max-w-md">
                      <FormField control={selfReviewForm.control} name="selfRating" render={({ field }) => (
                        <FormItem><FormLabel>Self rating (1–5)</FormLabel><FormControl><Input type="number" min={1} max={5} {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={selfReviewForm.control} name="selfComments" render={({ field }) => (
                        <FormItem><FormLabel>Comments (optional)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>
                      )} />
                      <Button type="submit">Submit self review</Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          )}

          {(isManager || isHR) && (
            <Card className="rounded-xl shadow-sm">
              <CardHeader><CardTitle className="text-base">Pending manager reviews</CardTitle></CardHeader>
              <CardContent>
                {pendingManagerReviews.length === 0 ? (
                  <p className="text-sm text-slate-500">No pending reviews.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Self rating</TableHead>
                        <TableHead>Status</TableHead>
                        {isManager && <TableHead className="w-[100px]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingManagerReviews.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{getById(r.employeeId)?.name ?? r.employeeId}</TableCell>
                          <TableCell>{r.selfRating ?? "—"}</TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          {isManager && (
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => { setManagerReviewId(r.id); managerReviewForm.reset({ managerRating: 3, managerComments: "" }); }}>Review</Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {isHR && (
            <Card className="rounded-xl shadow-sm">
              <CardHeader><CardTitle className="text-base">All reviews</CardTitle></CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">No reviews yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Self</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Final</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{getById(r.employeeId)?.name ?? r.employeeId}</TableCell>
                          <TableCell>{r.selfRating ?? "—"}</TableCell>
                          <TableCell>{r.managerRating ?? "—"}</TableCell>
                          <TableCell>{r.finalRating ?? "—"}</TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          <TableCell>
                            {r.status !== "Finalized" && (r.status === "Manager Review Submitted" || r.status === "Self Review Submitted") && (
                              <Button size="sm" variant="outline" onClick={() => { setFinalizeReviewId(r.id); setFinalizeRatingVal(3); }}>Finalize</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          <Dialog open={!!managerReviewId} onOpenChange={(open) => !open && setManagerReviewId(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Manager review</DialogTitle></DialogHeader>
              <Form {...managerReviewForm}>
                <form onSubmit={onManagerReview} className="space-y-4">
                  <FormField control={managerReviewForm.control} name="managerRating" render={({ field }) => (
                    <FormItem><FormLabel>Rating (1–5)</FormLabel><FormControl><Input type="number" min={1} max={5} {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={managerReviewForm.control} name="managerComments" render={({ field }) => (
                    <FormItem><FormLabel>Comments (optional)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>
                  )} />
                  <DialogFooter><Button type="button" variant="outline" onClick={() => setManagerReviewId(null)}>Cancel</Button><Button type="submit">Submit</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!finalizeReviewId} onOpenChange={(open) => !open && setFinalizeReviewId(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Finalize rating</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <label className="text-sm font-medium">Final rating (1–5)</label>
                <Input type="number" min={1} max={5} value={finalizeRatingVal} onChange={(e) => setFinalizeRatingVal(Number(e.target.value) || 3)} />
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setFinalizeReviewId(null)}>Cancel</Button><Button onClick={onFinalize}>Finalize</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="cycles" className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreateCycleOpen(true)}><Plus className="mr-1 h-4 w-4" /> Create cycle</Button>
          </div>
          <Card className="rounded-xl shadow-sm">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.type}</TableCell>
                      <TableCell>{formatDate(c.startDate)} – {formatDate(c.endDate)}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={createCycleOpen} onOpenChange={setCreateCycleOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Create cycle</DialogTitle></DialogHeader>
              <Form {...cycleForm}>
                <form onSubmit={onCreateCycle} className="space-y-4">
                  <FormField control={cycleForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Annual Review 2025" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={cycleForm.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Annual">Annual</SelectItem><SelectItem value="Mid-year">Mid-year</SelectItem><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="360-degree">360-degree feedback</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={cycleForm.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>Start date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={cycleForm.control} name="endDate" render={({ field }) => (
                    <FormItem><FormLabel>End date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={cycleForm.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateCycleOpen(false)}>Cancel</Button><Button type="submit">Create</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
