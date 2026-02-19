"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Calendar, FileText, Send, UserPlus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useRecruitmentStore } from "@/stores/recruitmentStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { CANDIDATE_STATUSES } from "@/lib/constants";
import type { CandidateStatus } from "@/types";
import type { Candidate } from "@/types";

const scheduleSchema = z.object({
  scheduledOn: z.string().min(1, "Date & time required"),
  type: z.string().min(1, "Type required"),
  interviewerId: z.string().min(1, "Select interviewer"),
  notes: z.string().optional(),
});

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  hireRecommendation: z.enum(["Yes", "No"]),
});

const offerSchema = z.object({
  ctc: z.string().min(1, "CTC required"),
  joiningDate: z.string().min(1, "Joining date required"),
  designation: z.string().min(1, "Designation required"),
});

type ScheduleValues = z.infer<typeof scheduleSchema>;
type FeedbackValues = z.infer<typeof feedbackSchema>;
type OfferValues = z.infer<typeof offerSchema>;

const KANBAN_COLUMNS: { status: CandidateStatus; label: string }[] = [
  { status: "Applied", label: "Applied" },
  { status: "Screened", label: "Screened" },
  { status: "Interview Scheduled", label: "Interview" },
  { status: "Offered", label: "Offered" },
  { status: "Joined", label: "Joined" },
  { status: "Rejected", label: "Rejected" },
];

function CandidateCard({
  candidate,
  jobTitle,
  onMove,
  onSchedule,
  onFeedback,
  onOffer,
  onConvertToEmployee,
  isHR,
}: {
  candidate: Candidate;
  jobTitle: string;
  onMove: (id: string, status: CandidateStatus) => void;
  onSchedule: (c: Candidate) => void;
  onFeedback: (c: Candidate, interviewId: string) => void;
  onOffer: (c: Candidate) => void;
  onConvertToEmployee: (c: Candidate) => void;
  isHR: boolean;
}) {
  const daysSince = differenceInDays(new Date(), new Date(candidate.appliedOn));

  return (
    <Card className="rounded-lg border-slate-200 shadow-sm">
      <CardContent className="p-3">
        <p className="font-medium text-slate-900">{candidate.name}</p>
        <p className="text-xs text-slate-500">{candidate.experience} · {candidate.currentCompany}</p>
        <p className="text-xs text-slate-600">Expected: {candidate.expectedCTC}</p>
        <p className="text-xs text-slate-400">Applied {daysSince}d ago</p>
        {candidate.resumeUrl && (
          <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
            View Resume
          </a>
        )}
        {isHR && (
          <div className="mt-2 flex flex-wrap gap-1">
            {KANBAN_COLUMNS.filter((col) => col.status !== candidate.status).map((col) => (
              <Button
                key={col.status}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onMove(candidate.id, col.status)}
              >
                {col.label}
              </Button>
            ))}
            {candidate.status !== "Interview Scheduled" && candidate.status !== "Offered" && candidate.status !== "Joined" && candidate.status !== "Rejected" && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onSchedule(candidate)}>
                Schedule
              </Button>
            )}
            {candidate.interviews.some((i) => i.status === "Scheduled") && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                const int = candidate.interviews.find((i) => i.status === "Scheduled");
                if (int) onFeedback(candidate, int.id);
              }}>
                Feedback
              </Button>
            )}
            {(candidate.status === "Interview Scheduled" || candidate.status === "Screened") && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOffer(candidate)}>
                Offer
              </Button>
            )}
            {(candidate.status === "Offered" || candidate.status === "Joined") && isHR && (
              <Button size="sm" className="h-7 text-xs" onClick={() => onConvertToEmployee(candidate)}>
                Convert to Employee
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CandidatesPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const session = useAuthStore((s) => s.session);
  const jobs = useRecruitmentStore((s) => s.jobs);
  const candidates = useRecruitmentStore((s) => s.candidates);
  const updateCandidateStatus = useRecruitmentStore((s) => s.updateCandidateStatus);
  const scheduleInterview = useRecruitmentStore((s) => s.scheduleInterview);
  const submitFeedback = useRecruitmentStore((s) => s.submitFeedback);
  const sendOffer = useRecruitmentStore((s) => s.sendOffer);
  const convertToEmployee = useRecruitmentStore((s) => s.convertToEmployee);
  const employees = useEmployeeStore((s) => s.employees);

  const [scheduleCandidate, setScheduleCandidate] = useState<Candidate | null>(null);
  const [feedbackCandidate, setFeedbackCandidate] = useState<Candidate | null>(null);
  const [feedbackInterviewId, setFeedbackInterviewId] = useState<string | null>(null);
  const [offerCandidate, setOfferCandidate] = useState<Candidate | null>(null);

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);
  const jobCandidates = useMemo(() => candidates.filter((c) => c.jobId === jobId), [candidates, jobId]);

  const scheduleForm = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { scheduledOn: "", type: "Technical", interviewerId: "", notes: "" },
  });
  const feedbackForm = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 3, feedback: "", strengths: "", weaknesses: "", hireRecommendation: "Yes" },
  });
  const offerForm = useForm<OfferValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: { ctc: "", joiningDate: "", designation: "" },
  });

  const isHR = session?.role === "hr";

  const onScheduleSubmit = scheduleForm.handleSubmit((data) => {
    if (!scheduleCandidate) return;
    const round = scheduleCandidate.interviews.length + 1;
    scheduleInterview(scheduleCandidate.id, {
      round,
      type: data.type,
      interviewerId: data.interviewerId,
      scheduledOn: data.scheduledOn.slice(0, 16),
      status: "Scheduled",
      feedback: null,
      rating: null,
    });
    toast.success("Interview scheduled");
    setScheduleCandidate(null);
    scheduleForm.reset();
  });

  const onFeedbackSubmit = feedbackForm.handleSubmit((data) => {
    if (!feedbackCandidate || !feedbackInterviewId) return;
    submitFeedback(feedbackCandidate.id, feedbackInterviewId, {
      rating: data.rating,
      feedback: data.feedback,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      hireRecommendation: data.hireRecommendation as "Yes" | "No",
    });
    toast.success("Feedback submitted");
    setFeedbackCandidate(null);
    setFeedbackInterviewId(null);
    feedbackForm.reset();
  });

  const onOfferSubmit = offerForm.handleSubmit((data) => {
    if (!offerCandidate) return;
    sendOffer(offerCandidate.id, {
      ctc: data.ctc,
      joiningDate: data.joiningDate,
      designation: data.designation,
    });
    toast.success("Offer sent");
    setOfferCandidate(null);
    offerForm.reset();
  });

  const openFeedback = (c: Candidate, interviewId: string) => {
    setFeedbackCandidate(c);
    setFeedbackInterviewId(interviewId);
    const int = c.interviews.find((i) => i.id === interviewId);
    if (int) {
      feedbackForm.reset({
        rating: int.rating ?? 3,
        feedback: int.feedback ?? "",
        strengths: int.strengths ?? "",
        weaknesses: int.weaknesses ?? "",
        hireRecommendation: (int.hireRecommendation as "Yes" | "No") ?? "Yes",
      });
    }
  };

  const openOffer = (c: Candidate) => {
    setOfferCandidate(c);
    offerForm.reset({ ctc: c.expectedCTC, joiningDate: "", designation: "" });
  };

  if (!job) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/recruitment")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <EmptyState icon={FileText} title="Job not found" description="" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/recruitment/${jobId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Candidates – ${job.title}`}
        description="Manage pipeline by stage."
      />

      {jobCandidates.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No candidates"
          description="No applicants for this job yet."
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const list = jobCandidates.filter((c) => c.status === col.status);
            return (
              <div
                key={col.status}
                className="min-w-[280px] rounded-xl border border-slate-200 bg-slate-50/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-slate-700">{col.label}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      jobTitle={job.title}
                      onMove={updateCandidateStatus}
                      onSchedule={setScheduleCandidate}
                      onFeedback={openFeedback}
                      onOffer={openOffer}
                      onConvertToEmployee={(c) => {
                        const prefill = convertToEmployee(c.id);
                        if (prefill) {
                          router.push(
                            `/employees/add?name=${encodeURIComponent(prefill.name)}&email=${encodeURIComponent(prefill.email)}&phone=${encodeURIComponent(prefill.phone)}`
                          );
                        }
                      }}
                      isHR={isHR}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!scheduleCandidate} onOpenChange={(open) => !open && setScheduleCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
          </DialogHeader>
          <Form {...scheduleForm}>
            <form onSubmit={onScheduleSubmit} className="space-y-4">
              <FormField control={scheduleForm.control} name="scheduledOn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={scheduleForm.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={scheduleForm.control} name="interviewerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={scheduleForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setScheduleCandidate(null)}>Cancel</Button>
                <Button type="submit">Schedule</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!feedbackCandidate} onOpenChange={(open) => !open && (setFeedbackCandidate(null), setFeedbackInterviewId(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview feedback</DialogTitle>
          </DialogHeader>
          <Form {...feedbackForm}>
            <form onSubmit={onFeedbackSubmit} className="space-y-4">
              <FormField control={feedbackForm.control} name="rating" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (1–5)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={5} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={feedbackForm.control} name="feedback" render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={feedbackForm.control} name="strengths" render={({ field }) => (
                <FormItem>
                  <FormLabel>Strengths</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={feedbackForm.control} name="weaknesses" render={({ field }) => (
                <FormItem>
                  <FormLabel>Weaknesses</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={feedbackForm.control} name="hireRecommendation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hire recommendation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setFeedbackCandidate(null); setFeedbackInterviewId(null); }}>Cancel</Button>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!offerCandidate} onOpenChange={(open) => !open && setOfferCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send offer</DialogTitle>
          </DialogHeader>
          <Form {...offerForm}>
            <form onSubmit={onOfferSubmit} className="space-y-4">
              <FormField control={offerForm.control} name="ctc" render={({ field }) => (
                <FormItem>
                  <FormLabel>CTC</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. 18L" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={offerForm.control} name="joiningDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Joining date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={offerForm.control} name="designation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Software Engineer" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOfferCandidate(null)}>Cancel</Button>
                <Button type="submit">Generate & Send</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
