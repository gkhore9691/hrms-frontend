import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { JOB_OPENINGS, CANDIDATES } from "@/data/dummyData";
import { useAdminStore } from "@/stores/adminStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type {
  JobOpening,
  Candidate,
  CandidateStatus,
  Interview,
} from "@/types";

type AddCandidateInput = Pick<Candidate, "jobId" | "name" | "email"> & Partial<Pick<Candidate, "phone" | "experience" | "currentCTC" | "expectedCTC" | "currentCompany" | "location" | "resumeUrl" | "notes">>;

interface RecruitmentState {
  jobs: JobOpening[];
  candidates: Candidate[];
  addJob: (job: Omit<JobOpening, "id" | "postedOn" | "applicantCount">) => void;
  addCandidate: (input: AddCandidateInput) => void;
  updateJob: (jobId: string, data: Partial<Omit<JobOpening, "id" | "postedOn" | "applicantCount">>) => void;
  updateCandidateStatus: (candidateId: string, status: CandidateStatus) => void;
  scheduleInterview: (candidateId: string, interview: Omit<Interview, "id">) => void;
  submitFeedback: (
    candidateId: string,
    interviewId: string,
    data: {
      feedback?: string;
      rating: number;
      strengths?: string;
      weaknesses?: string;
      hireRecommendation?: "Yes" | "No";
    }
  ) => void;
  sendOffer: (
    candidateId: string,
    offerData?: { ctc: string; joiningDate: string; designation: string }
  ) => void;
  convertToEmployee: (candidateId: string) => { name: string; email: string; phone: string } | null;
}

function nextJobId(jobs: JobOpening[]): string {
  const nums = jobs.map((j) => parseInt(j.id.replace("job", ""), 10)).filter((n) => !Number.isNaN(n));
  return `job${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

function nextCandidateId(candidates: Candidate[]): string {
  const nums = candidates.map((c) => parseInt(c.id.replace("c", ""), 10)).filter((n) => !Number.isNaN(n));
  return `c${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

function nextInterviewId(candidate: Candidate): string {
  const nums = candidate.interviews
    .map((i) => parseInt(i.id.replace("int", ""), 10))
    .filter((n) => !Number.isNaN(n));
  return `int${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

export const useRecruitmentStore = create<RecruitmentState>()(
  persist(
    (set, get) => ({
      jobs: JOB_OPENINGS,
      candidates: CANDIDATES,

      addJob: (input) => {
        const jobs = get().jobs;
        const id = nextJobId(jobs);
        const job: JobOpening = {
          ...input,
          id,
          postedOn: new Date().toISOString().slice(0, 10),
          applicantCount: 0,
        };
        set({ jobs: [...jobs, job] });
        useAdminStore.getState().addAuditLog({
          action: "Job Posted",
          module: "Recruitment",
          performedBy: "EMP001",
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: job.title,
        });
      },

      updateJob: (jobId, data) => {
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === jobId ? { ...j, ...data } : j)),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Job Updated",
          module: "Recruitment",
          performedBy: "EMP001",
          target: jobId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: data.title ?? "Job updated",
        });
      },

      addCandidate: (input) => {
        const candidates = get().candidates;
        const id = nextCandidateId(candidates);
        const candidate: Candidate = {
          id,
          jobId: input.jobId,
          name: input.name,
          email: input.email,
          phone: input.phone ?? "",
          experience: input.experience ?? "",
          currentCTC: input.currentCTC ?? "",
          expectedCTC: input.expectedCTC ?? "",
          currentCompany: input.currentCompany ?? "",
          location: input.location ?? "",
          status: "Applied",
          appliedOn: new Date().toISOString().slice(0, 10),
          resumeUrl: input.resumeUrl ?? "#",
          interviews: [],
          notes: input.notes ?? "",
        };
        set((state) => ({
          candidates: [...state.candidates, candidate],
          jobs: state.jobs.map((j) =>
            j.id === input.jobId ? { ...j, applicantCount: j.applicantCount + 1 } : j
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Application Submitted",
          module: "Recruitment",
          performedBy: input.email,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Applied for job ${input.jobId}`,
        });
      },

      updateCandidateStatus: (candidateId, status) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, status } : c
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Candidate Status Updated",
          module: "Recruitment",
          performedBy: "EMP001",
          target: candidateId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Status: ${status}`,
        });
      },

      scheduleInterview: (candidateId, input) => {
        const candidate = get().candidates.find((c) => c.id === candidateId);
        if (!candidate) return;
        const id = nextInterviewId(candidate);
        const interview: Interview = { ...input, id, feedback: null, rating: null };
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId
              ? { ...c, interviews: [...c.interviews, interview], status: "Interview Scheduled" as CandidateStatus }
              : c
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Interview Scheduled",
          module: "Recruitment",
          performedBy: "EMP001",
          target: candidateId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Round ${input.round} - ${input.type}`,
        });
        const interviewerUserId = useAdminStore.getState().getUserIdByEmployeeId(input.interviewerId);
        if (interviewerUserId) {
          useNotificationStore.getState().addNotification({
            userId: interviewerUserId,
            title: "Interview scheduled",
            message: `You have an interview scheduled for ${candidate.name} (Round ${input.round}, ${input.type}).`,
            link: "/recruitment",
          });
        }
      },

      submitFeedback: (candidateId, interviewId, data) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  interviews: c.interviews.map((i) =>
                    i.id === interviewId
                      ? {
                          ...i,
                          feedback: data.feedback ?? i.feedback,
                          rating: data.rating,
                          strengths: data.strengths ?? i.strengths ?? null,
                          weaknesses: data.weaknesses ?? i.weaknesses ?? null,
                          hireRecommendation: data.hireRecommendation ?? i.hireRecommendation ?? null,
                          status: "Completed",
                        }
                      : i
                  ),
                }
              : c
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Interview Feedback Submitted",
          module: "Recruitment",
          performedBy: "EMP002",
          target: candidateId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Rating: ${data.rating}`,
        });
      },

      sendOffer: (candidateId) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, status: "Offered" as CandidateStatus } : c
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Offer Sent",
          module: "Recruitment",
          performedBy: "EMP001",
          target: candidateId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: "Offer letter sent",
        });
      },

      convertToEmployee: (candidateId) => {
        const cand = get().candidates.find((c) => c.id === candidateId);
        if (!cand) return null;
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, status: "Joined" as CandidateStatus } : c
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Candidate Converted to Employee",
          module: "Recruitment",
          performedBy: "EMP001",
          target: candidateId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `${cand.name} → Employee`,
        });
        return {
          name: cand.name,
          email: cand.email,
          phone: cand.phone ?? "",
        };
      },
    }),
    { name: "hrms-recruitment", storage: createJSONStorage(() => localStorage) }
  )
);
