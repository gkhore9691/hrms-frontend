import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PERFORMANCE_CYCLES, GOALS, REVIEWS } from "@/data/dummyData";
import { useAdminStore } from "@/stores/adminStore";
import type {
  PerformanceCycle,
  Goal,
  Review,
  ReviewStatus,
} from "@/types";

function nextCycleId(cycles: PerformanceCycle[]): string {
  const nums = cycles.map((c) => parseInt(c.id.replace("pc", ""), 10)).filter((n) => !Number.isNaN(n));
  return `pc${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

interface PerformanceState {
  cycles: PerformanceCycle[];
  goals: Goal[];
  reviews: Review[];
  createCycle: (cycle: Omit<PerformanceCycle, "id">) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  submitSelfReview: (employeeId: string, cycleId: string, data: { selfRating: number; selfComments: string }) => void;
  submitManagerReview: (reviewId: string, data: { managerRating: number; managerComments: string }) => void;
  finalizeRating: (reviewId: string, rating: number) => void;
}

function nextGoalId(goals: Goal[]): string {
  const nums = goals.map((g) => parseInt(g.id.replace("g", ""), 10)).filter((n) => !Number.isNaN(n));
  return `g${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

function nextReviewId(reviews: Review[]): string {
  const nums = reviews.map((r) => parseInt(r.id.replace("rev", ""), 10)).filter((n) => !Number.isNaN(n));
  return `rev${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      cycles: PERFORMANCE_CYCLES,
      goals: GOALS,
      reviews: REVIEWS,

      createCycle: (input) => {
        const cycles = get().cycles;
        const id = nextCycleId(cycles);
        set({ cycles: [...cycles, { ...input, id }] });
        useAdminStore.getState().addAuditLog({
          action: "Cycle Created",
          module: "Performance",
          performedBy: "EMP001",
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: input.name,
        });
      },

      addGoal: (input) => {
        const goals = get().goals;
        const id = nextGoalId(goals);
        set({ goals: [...goals, { ...input, id }] });
        useAdminStore.getState().addAuditLog({
          action: "Goal Set",
          module: "Performance",
          performedBy: input.setBy,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: input.title,
        });
      },

      updateGoalProgress: (goalId, progress) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, progress, status: progress >= 100 ? "Completed" as const : g.status } : g
          ),
        }));
      },

      submitSelfReview: (employeeId, cycleId, data) => {
        const reviews = get().reviews;
        const existing = reviews.find((r) => r.employeeId === employeeId && r.cycleId === cycleId);
        if (existing) {
          set((state) => ({
            reviews: state.reviews.map((r) =>
              r.id === existing.id
                ? {
                    ...r,
                    selfRating: data.selfRating,
                    selfComments: data.selfComments,
                    status: "Self Review Submitted" as ReviewStatus,
                    submittedOn: new Date().toISOString().slice(0, 10),
                  }
                : r
            ),
          }));
        } else {
          const id = nextReviewId(reviews);
          set({
            reviews: [
              ...reviews,
              {
                id,
                employeeId,
                cycleId,
                selfRating: data.selfRating,
                selfComments: data.selfComments,
                managerRating: null,
                managerComments: null,
                finalRating: null,
                status: "Self Review Submitted" as ReviewStatus,
                submittedOn: new Date().toISOString().slice(0, 10),
              },
            ],
          });
        }
        useAdminStore.getState().addAuditLog({
          action: "Self Review Submitted",
          module: "Performance",
          performedBy: employeeId,
          target: cycleId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: "Self assessment submitted",
        });
      },

      submitManagerReview: (reviewId, data) => {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  managerRating: data.managerRating,
                  managerComments: data.managerComments,
                  status: "Manager Review Submitted" as ReviewStatus,
                }
              : r
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Manager Review Submitted",
          module: "Performance",
          performedBy: "EMP002",
          target: reviewId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Rating: ${data.managerRating}`,
        });
      },

      finalizeRating: (reviewId, rating) => {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId
              ? { ...r, finalRating: rating, status: "Finalized" as ReviewStatus }
              : r
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Review Finalized",
          module: "Performance",
          performedBy: "EMP001",
          target: reviewId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Final rating: ${rating}`,
        });
      },
    }),
    { name: "hrms-performance", storage: createJSONStorage(() => localStorage) }
  )
);
