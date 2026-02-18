"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { SALARY_BANDS } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import type { SalaryBreakdown } from "@/types";

const editSchema = z.object({
  ctc: z.number().min(100000, "Enter valid CTC"),
});

type EditValues = z.infer<typeof editSchema>;

function ctcToSalary(ctc: number): SalaryBreakdown {
  const basic = Math.round(ctc * 0.4);
  const hra = Math.round(basic * 0.5);
  const allowances = ctc - basic - hra;
  const pf = Math.round(basic * 0.12);
  const tax = Math.round((basic + hra + allowances) * 0.1);
  return {
    ctc,
    basic,
    hra,
    allowances: Math.max(0, allowances),
    pf,
    tax,
  };
}

export default function SalaryStructuresPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const employees = useEmployeeStore((s) => s.employees);
  const updateEmployee = useEmployeeStore((s) => s.updateEmployee);

  const [editId, setEditId] = useState<string | null>(null);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { ctc: 600000 },
  });

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const onEditSubmit = form.handleSubmit((data) => {
    if (!editId) return;
    const salary = ctcToSalary(data.ctc);
    updateEmployee(editId, { salary });
    toast.success("Salary updated");
    setEditId(null);
  });

  const openEdit = (emp: (typeof employees)[0]) => {
    setEditId(emp.id);
    form.reset({ ctc: emp.salary.ctc });
  };

  if (!session || session.role !== "hr") return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Salary Structures"
        description="View and edit employee salary (CTC and components)."
      />

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Salary bands (reference)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {SALARY_BANDS.map((b) => (
              <div
                key={b.name}
                className="rounded-lg border border-slate-200 px-4 py-2"
              >
                <p className="font-medium text-slate-900">{b.name}</p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(b.minCtc)} – {formatCurrency(b.maxCtc)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Employee salary assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Current CTC</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>HRA</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.id}</TableCell>
                  <TableCell>{formatCurrency(emp.salary.ctc)}</TableCell>
                  <TableCell>{formatCurrency(emp.salary.basic)}</TableCell>
                  <TableCell>{formatCurrency(emp.salary.hra)}</TableCell>
                  <TableCell>{formatCurrency(emp.salary.allowances)}</TableCell>
                  <TableCell>
                    <Dialog
                      open={editId === emp.id}
                      onOpenChange={(open) => !open && setEditId(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openEdit(emp)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit salary – {emp.name}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={onEditSubmit} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="ctc"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CTC (annual ₹)</FormLabel>
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
                            <p className="text-xs text-slate-500">
                              Components (Basic 40%, HRA 50% of Basic, Allowances) are auto-calculated on save.
                            </p>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setEditId(null)}>
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
    </div>
  );
}
