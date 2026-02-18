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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEPARTMENTS, DESIGNATIONS } from "@/data/dummyData";
import { SHIFTS } from "@/data/dummyData";
import { EMPLOYMENT_TYPES, WORK_LOCATIONS, GENDER_OPTIONS, BLOOD_GROUPS } from "@/lib/constants";
import type { Employee, EmployeeDocument, SalaryBreakdown } from "@/types";

const step1Schema = z.object({
  name: z.string().min(2, "Name required"),
  dob: z.string().min(1, "DOB required"),
  gender: z.string().min(1, "Select gender"),
  bloodGroup: z.string().min(1, "Select blood group"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required"),
  address: z.string().min(5, "Address required"),
});

const step2Schema = z.object({
  department: z.string().min(1, "Select department"),
  designation: z.string().min(1, "Select designation"),
  reportingManagerId: z.string().nullable(),
  dateOfJoining: z.string().min(1, "DOJ required"),
  workLocation: z.string().min(1, "Select location"),
  shiftId: z.string().min(1, "Select shift"),
  employmentType: z.string().min(1, "Select type"),
});

const step3Schema = z.object({
  aadhaarName: z.string().optional(),
  panName: z.string().optional(),
  offerLetterName: z.string().optional(),
});

const step4Schema = z.object({
  ctc: z.number().min(100000, "Enter valid CTC"),
  basic: z.number().min(0),
  hra: z.number().min(0),
  allowances: z.number().min(0),
  bank: z.string().min(2, "Bank name required"),
  accountNo: z.string().min(4, "Account number required"),
  ifsc: z.string().min(8, "Valid IFSC required"),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;
type Step4Values = z.infer<typeof step4Schema>;

const STEPS = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Job Details" },
  { id: 3, title: "Documents" },
  { id: 4, title: "Salary & Bank" },
];

function nextEmployeeId(employees: Employee[]): string {
  const nums = employees
    .map((e) => parseInt(e.id.replace("EMP", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `EMP${String(max + 1).padStart(3, "0")}`;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const employees = useEmployeeStore((s) => s.employees);
  const addEmployee = useEmployeeStore((s) => s.addEmployee);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Values & Step2Values & Step3Values & Step4Values>>({});

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData as Step1Values,
  });
  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { reportingManagerId: null } as Step2Values,
  });
  const form3 = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: {},
  });
  const form4 = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    defaultValues: { ctc: 600000, basic: 300000, hra: 120000, allowances: 90000 },
  });

  useEffect(() => {
    if (step === 2 && (formData.department || formData.designation)) {
      form2.reset({
        department: formData.department ?? "",
        designation: formData.designation ?? "",
        reportingManagerId: formData.reportingManagerId ?? null,
        dateOfJoining: formData.dateOfJoining ?? "",
        workLocation: formData.workLocation ?? "",
        shiftId: formData.shiftId ?? "",
        employmentType: formData.employmentType ?? "",
      });
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (step === 3) {
      form3.reset({
        aadhaarName: formData.aadhaarName ?? "",
        panName: formData.panName ?? "",
        offerLetterName: formData.offerLetterName ?? "",
      });
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (step === 4 && (formData.ctc != null || formData.bank)) {
      form4.reset({
        ctc: formData.ctc ?? 600000,
        basic: formData.basic ?? 300000,
        hra: formData.hra ?? 120000,
        allowances: formData.allowances ?? 90000,
        bank: formData.bank ?? "",
        accountNo: formData.accountNo ?? "",
        ifsc: formData.ifsc ?? "",
      });
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const onStep1Next = form1.handleSubmit((data) => {
    setFormData((p) => ({ ...p, ...data }));
    setStep(2);
  });
  const onStep2Next = form2.handleSubmit((data) => {
    setFormData((p) => ({ ...p, ...data }));
    setStep(3);
  });
  const onStep3Next = form3.handleSubmit((data) => {
    setFormData((p) => ({ ...p, ...data }));
    setStep(4);
  });

  const onStep4Submit = form4.handleSubmit((data) => {
    const all = { ...formData, ...data } as Step1Values & Step2Values & Step3Values & Step4Values;
    const id = nextEmployeeId(employees);
    const salary: SalaryBreakdown = {
      ctc: data.ctc,
      basic: data.basic,
      hra: data.hra,
      allowances: data.allowances,
      pf: Math.round(data.basic * 0.12),
      tax: Math.round((data.basic + data.hra + data.allowances) * 0.1),
    };
    const docs: EmployeeDocument[] = [];
    if (all.aadhaarName) docs.push({ id: `doc-${id}-1`, name: all.aadhaarName, type: "KYC", uploadedOn: new Date().toISOString().slice(0, 10), status: "Pending" });
    if (all.panName) docs.push({ id: `doc-${id}-2`, name: all.panName, type: "KYC", uploadedOn: new Date().toISOString().slice(0, 10), status: "Pending" });
    if (all.offerLetterName) docs.push({ id: `doc-${id}-3`, name: all.offerLetterName, type: "HR", uploadedOn: new Date().toISOString().slice(0, 10), status: "Pending" });

    const employee: Employee = {
      id,
      userId: null,
      name: all.name,
      email: all.email,
      phone: all.phone,
      photo: null,
      gender: all.gender,
      dob: all.dob,
      bloodGroup: all.bloodGroup,
      address: all.address,
      department: all.department,
      designation: all.designation,
      reportingManagerId: (all.reportingManagerId && all.reportingManagerId !== "none") ? all.reportingManagerId : null,
      dateOfJoining: all.dateOfJoining,
      employmentType: all.employmentType,
      status: "Active",
      workLocation: all.workLocation,
      skills: [],
      bankAccount: { bank: data.bank, accountNo: data.accountNo, ifsc: data.ifsc },
      emergencyContact: { name: "To be updated", relation: "-", phone: "-" },
      documents: docs,
      salary,
    };
    addEmployee(employee);
    toast.success(`Employee ${id} added successfully`);
    router.push(`/employees/${id}`);
  });

  if (!session || session.role !== "hr") return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Employee"
        description="Create a new employee record. Complete all four steps."
      />

      <div className="flex gap-2 mb-6">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              step === s.id ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"
            }`}
          >
            <span>{s.id}</span>
            <span className="hidden sm:inline">{s.title}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Personal information</CardTitle></CardHeader>
          <CardContent>
            <Form {...form1}>
              <form onSubmit={onStep1Next} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form1.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form1.control} name="dob" render={({ field }) => (
                    <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form1.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form1.control} name="bloodGroup" render={({ field }) => (
                    <FormItem><FormLabel>Blood group</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form1.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form1.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form1.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit">Next: Job Details</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Job details</CardTitle></CardHeader>
          <CardContent>
            <Form {...form2}>
              <form onSubmit={onStep2Next} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form2.control} name="department" render={({ field }) => (
                    <FormItem><FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form2.control} name="designation" render={({ field }) => (
                    <FormItem><FormLabel>Designation</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form2.control} name="reportingManagerId" render={({ field }) => (
                    <FormItem><FormLabel>Reporting manager</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v || null)} value={field.value ?? "none"}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {employees.filter((e) => e.id !== session?.employeeId).map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form2.control} name="dateOfJoining" render={({ field }) => (
                    <FormItem><FormLabel>Date of joining</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form2.control} name="workLocation" render={({ field }) => (
                    <FormItem><FormLabel>Work location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{WORK_LOCATIONS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form2.control} name="shiftId" render={({ field }) => (
                    <FormItem><FormLabel>Shift</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{SHIFTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form2.control} name="employmentType" render={({ field }) => (
                    <FormItem><FormLabel>Employment type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button type="submit">Next: Documents</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Documents (simulated)</CardTitle></CardHeader>
          <CardContent>
            <Form {...form3}>
              <form onSubmit={onStep3Next} className="space-y-4">
                <FormField control={form3.control} name="aadhaarName" render={({ field }) => (
                  <FormItem><FormLabel>Aadhaar (file name)</FormLabel><FormControl><Input placeholder="e.g. aadhaar.pdf" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form3.control} name="panName" render={({ field }) => (
                  <FormItem><FormLabel>PAN (file name)</FormLabel><FormControl><Input placeholder="e.g. pan.pdf" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form3.control} name="offerLetterName" render={({ field }) => (
                  <FormItem><FormLabel>Offer letter (file name)</FormLabel><FormControl><Input placeholder="e.g. offer.pdf" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button type="submit">Next: Salary & Bank</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader><CardTitle className="text-base">Salary & bank</CardTitle></CardHeader>
          <CardContent>
            <Form {...form4}>
              <form onSubmit={onStep4Submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form4.control} name="ctc" render={({ field }) => (
                    <FormItem><FormLabel>CTC (annual ₹)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form4.control} name="basic" render={({ field }) => (
                    <FormItem><FormLabel>Basic (annual)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form4.control} name="hra" render={({ field }) => (
                    <FormItem><FormLabel>HRA (annual)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form4.control} name="allowances" render={({ field }) => (
                    <FormItem><FormLabel>Allowances (annual)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form4.control} name="bank" render={({ field }) => (
                    <FormItem><FormLabel>Bank name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form4.control} name="accountNo" render={({ field }) => (
                    <FormItem><FormLabel>Account number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form4.control} name="ifsc" render={({ field }) => (
                    <FormItem><FormLabel>IFSC</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
                  <Button type="submit">Add Employee</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
