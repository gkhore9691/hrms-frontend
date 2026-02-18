"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Briefcase, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useRecruitmentStore } from "@/stores/recruitmentStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { RoleGuard } from "@/components/common/RoleGuard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DEPARTMENTS } from "@/data/dummyData";
import { JOB_STATUSES } from "@/lib/constants";
import { EMPLOYMENT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import type { JobOpening } from "@/types";

const postJobSchema = z.object({
  title: z.string().min(2, "Title required"),
  department: z.string().min(1, "Select department"),
  location: z.string().min(1, "Location required"),
  type: z.string().min(1, "Select type"),
  experience: z.string().min(1, "Experience required"),
  salary: z.string().min(1, "Salary range required"),
  description: z.string().min(10, "Description required"),
  closingDate: z.string().min(1, "Closing date required"),
  requirements: z.string().min(1, "At least one requirement"),
});

type PostJobValues = z.infer<typeof postJobSchema>;

export default function RecruitmentPage() {
  const session = useAuthStore((s) => s.session);
  const jobs = useRecruitmentStore((s) => s.jobs);
  const candidates = useRecruitmentStore((s) => s.candidates);
  const addJob = useRecruitmentStore((s) => s.addJob);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [postOpen, setPostOpen] = useState(false);

  const form = useForm<PostJobValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: "",
      department: "",
      location: "",
      type: "Full-time",
      experience: "",
      salary: "",
      description: "",
      closingDate: "",
      requirements: "",
    },
  });

  const applicantCountByJob = useMemo(() => {
    const map: Record<string, number> = {};
    candidates.forEach((c) => {
      map[c.jobId] = (map[c.jobId] ?? 0) + 1;
    });
    return map;
  }, [candidates]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (deptFilter !== "all" && j.department !== deptFilter) return false;
      if (locationFilter !== "all" && !j.location.includes(locationFilter)) return false;
      return true;
    });
  }, [jobs, statusFilter, deptFilter, locationFilter]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => j.location.split(/[,/]/).forEach((s) => set.add(s.trim())));
    return Array.from(set).filter(Boolean).sort();
  }, [jobs]);

  const onPostSubmit = form.handleSubmit((data) => {
    addJob({
      ...data,
      requirements: data.requirements.split(/\n/).map((s) => s.trim()).filter(Boolean),
      status: "Open",
    });
    toast.success("Job posted");
    setPostOpen(false);
    form.reset();
  });

  const isHR = session?.role === "hr";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment"
        description="Manage job openings and candidates."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {JOB_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locationOptions.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <RoleGuard permission="recruitment.create">
          <Dialog open={postOpen} onOpenChange={setPostOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post new job</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={onPostSubmit} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem><FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} placeholder="e.g. Bengaluru / Remote" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="experience" render={({ field }) => (
                    <FormItem><FormLabel>Experience</FormLabel><FormControl><Input {...field} placeholder="e.g. 3-6 years" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="salary" render={({ field }) => (
                    <FormItem><FormLabel>Salary range</FormLabel><FormControl><Input {...field} placeholder="e.g. ₹15L - ₹25L" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="closingDate" render={({ field }) => (
                    <FormItem><FormLabel>Closing date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="requirements" render={({ field }) => (
                    <FormItem><FormLabel>Requirements (one per line)</FormLabel><FormControl><Textarea rows={3} {...field} placeholder="3+ years React&#10;TypeScript" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
                    <Button type="submit">Post Job</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs"
          description={jobs.length === 0 ? "Post your first job to get started." : "No jobs match the current filters."}
          action={isHR ? { label: "Post New Job", onClick: () => setPostOpen(true) } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="rounded-xl shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-slate-900">{job.title}</h3>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{job.department}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{job.location}</Badge>
                  <Badge variant="outline" className="text-xs">{job.experience}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">{job.salary}</p>
                <p className="mt-1 text-xs text-slate-500">Posted {formatDate(job.postedOn)} · {applicantCountByJob[job.id] ?? job.applicantCount} applicants</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="default" size="sm" asChild>
                    <Link href={`/recruitment/${job.id}`}>View</Link>
                  </Button>
                  {isHR && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/recruitment/${job.id}?edit=1`}>Edit</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
