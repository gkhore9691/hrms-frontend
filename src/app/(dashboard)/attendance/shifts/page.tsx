"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useShiftStore } from "@/stores/shiftStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import type { Shift } from "@/types";

const editShiftSchema = z.object({
  name: z.string().min(1, "Name required"),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().min(1, "End time required"),
  breakMinutes: z.number().min(0, "Break minutes required"),
});

const assignSchema = z.object({
  employeeId: z.string().min(1, "Select employee"),
  shiftId: z.string().min(1, "Select shift"),
  effectiveFrom: z.string().min(1, "Date required"),
});

type EditShiftValues = z.infer<typeof editShiftSchema>;
type AssignValues = z.infer<typeof assignSchema>;

export default function ShiftsPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const employees = useEmployeeStore((s) => s.employees);
  const shifts = useShiftStore((s) => s.shifts);
  const assignments = useShiftStore((s) => s.assignments);
  const updateShift = useShiftStore((s) => s.updateShift);
  const addAssignment = useShiftStore((s) => s.addAssignment);
  const getById = useEmployeeStore((s) => s.getById);

  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const editForm = useForm<EditShiftValues>({
    resolver: zodResolver(editShiftSchema),
    defaultValues: { name: "", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
  });

  const assignForm = useForm<AssignValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { employeeId: "", shiftId: "", effectiveFrom: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    if (editingShift) {
      editForm.reset({
        name: editingShift.name,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        breakMinutes: editingShift.breakMinutes,
      });
    }
  }, [editingShift, editForm]);

  const onEditOpen = (shift: Shift) => {
    setEditingShift(shift);
  };

  const onEditSubmit = editForm.handleSubmit((data) => {
    if (!editingShift) return;
    updateShift(editingShift.id, data);
    toast.success("Shift updated");
    setEditingShift(null);
  });

  const onAssignSubmit = assignForm.handleSubmit((data) => {
    addAssignment({
      employeeId: data.employeeId,
      shiftId: data.shiftId,
      effectiveFrom: data.effectiveFrom,
    });
    toast.success("Shift assigned");
    setAssignOpen(false);
    assignForm.reset({ employeeId: "", shiftId: "", effectiveFrom: new Date().toISOString().slice(0, 10) });
  });

  const assignmentWithDetails = assignments
    .map((a) => ({
      ...a,
      employee: getById(a.employeeId),
      shift: shifts.find((s) => s.id === a.shiftId),
    }))
    .filter((a) => a.employee && a.shift)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

  if (!session || session.role !== "hr") return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Shift Management"
        description="Define shifts and assign them to employees."
      />

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Shift definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Break (min)</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell>{shift.startTime}</TableCell>
                  <TableCell>{shift.endTime}</TableCell>
                  <TableCell>{shift.breakMinutes}</TableCell>
                  <TableCell>
                    <Dialog
                      open={editingShift?.id === shift.id}
                      onOpenChange={(open) => {
                        if (!open) setEditingShift(null);
                        else onEditOpen(shift);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit shift</DialogTitle>
                        </DialogHeader>
                        <Form {...editForm}>
                          <form onSubmit={onEditSubmit} className="space-y-4">
                            <FormField
                              control={editForm.control}
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
                              control={editForm.control}
                              name="startTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="endTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="breakMinutes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Break (minutes)</FormLabel>
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
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setEditingShift(null)}>
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

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Employee shift assignments</CardTitle>
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Assign shift</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign shift</DialogTitle>
              </DialogHeader>
              <Form {...assignForm}>
                <form onSubmit={onAssignSubmit} className="space-y-4">
                  <FormField
                    control={assignForm.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.name} ({e.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignForm.control}
                    name="shiftId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shift" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shifts.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} ({s.startTime}–{s.endTime})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignForm.control}
                    name="effectiveFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective from</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Assign</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {assignmentWithDetails.length === 0 ? (
            <p className="text-sm text-slate-500">No assignments yet. Use &quot;Assign shift&quot; to add one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Effective from</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentWithDetails.map((a) => (
                  <TableRow key={`${a.employeeId}-${a.effectiveFrom}`}>
                    <TableCell className="font-medium">{a.employee?.name}</TableCell>
                    <TableCell>{a.shift?.name}</TableCell>
                    <TableCell>{formatDate(a.effectiveFrom)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
