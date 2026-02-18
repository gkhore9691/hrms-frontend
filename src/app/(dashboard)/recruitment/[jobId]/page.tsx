"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Users, Send } from "lucide-react";
import { toast } from "sonner";
import { useRecruitmentStore } from "@/stores/recruitmentStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/formatters";
import { CANDIDATE_STATUSES } from "@/lib/constants";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const jobs = useRecruitmentStore((s) => s.jobs);
  const candidates = useRecruitmentStore((s) => s.candidates);
  const addCandidate = useRecruitmentStore((s) => s.addCandidate);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyPhone, setApplyPhone] = useState("");
  const [applyExp, setApplyExp] = useState("");
  const [applyResume, setApplyResume] = useState("");

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);
  const jobCandidates = useMemo(() => candidates.filter((c) => c.jobId === jobId), [candidates, jobId]);

  const funnelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CANDIDATE_STATUSES.forEach((s) => (counts[s] = 0));
    jobCandidates.forEach((c) => {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    });
    return counts;
  }, [jobCandidates]);

  if (!job) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/recruitment")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <EmptyState
          icon={Users}
          title="Job not found"
          description="This job may have been removed."
          action={{ label: "Back to jobs", onClick: () => router.push("/recruitment") }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/recruitment">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={job.title}
        description={`${job.department} · ${job.location}`}
      />

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{job.type}</Badge>
            <Badge variant="outline">{job.experience}</Badge>
            <Badge>{job.salary}</Badge>
            <Badge variant="outline">{job.status}</Badge>
          </div>
          <p className="text-sm text-slate-600">{job.description}</p>
          <div>
            <p className="text-sm font-medium text-slate-700">Requirements</p>
            <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
              {job.requirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">
            Posted {formatDate(job.postedOn)} · Closes {formatDate(job.closingDate)}
          </p>
        </CardContent>
      </Card>

      {job.status === "Open" && (
        <Card className="rounded-xl shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Apply for this job</CardTitle>
          </CardHeader>
          <CardContent>
            {!applyOpen ? (
              <Button onClick={() => setApplyOpen(true)}>
                <Send className="mr-1 h-4 w-4" />
                Submit application
              </Button>
            ) : (
              <div className="space-y-3 max-w-md">
                <Input placeholder="Full name *" value={applyName} onChange={(e) => setApplyName(e.target.value)} />
                <Input type="email" placeholder="Email *" value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)} />
                <Input placeholder="Phone" value={applyPhone} onChange={(e) => setApplyPhone(e.target.value)} />
                <Input placeholder="Experience (e.g. 3 years)" value={applyExp} onChange={(e) => setApplyExp(e.target.value)} />
                <Input placeholder="Resume URL" value={applyResume} onChange={(e) => setApplyResume(e.target.value)} />
                <div className="flex gap-2">
                  <Button
                    disabled={!applyName.trim() || !applyEmail.trim()}
                    onClick={() => {
                      addCandidate({
                        jobId,
                        name: applyName.trim(),
                        email: applyEmail.trim(),
                        phone: applyPhone.trim(),
                        experience: applyExp.trim(),
                        resumeUrl: applyResume.trim() || "#",
                      });
                      toast.success("Application submitted");
                      setApplyName("");
                      setApplyEmail("");
                      setApplyPhone("");
                      setApplyExp("");
                      setApplyResume("");
                      setApplyOpen(false);
                    }}
                  >
                    Submit
                  </Button>
                  <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Applicants funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {CANDIDATE_STATUSES.map((status) => (
              <div key={status} className="rounded-lg border border-slate-200 px-4 py-2">
                <p className="text-xs font-medium text-slate-500">{status}</p>
                <p className="text-xl font-semibold text-slate-900">{funnelCounts[status] ?? 0}</p>
              </div>
            ))}
          </div>
          <Button className="mt-4" asChild>
            <Link href={`/recruitment/${jobId}/candidates`}>
              <Users className="mr-1 h-4 w-4" />
              View Candidates
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
