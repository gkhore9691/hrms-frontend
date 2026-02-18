import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ONBOARDING_CHECKLISTS } from "@/data/dummyData";
import { useAdminStore } from "@/stores/adminStore";
import type { OnboardingChecklist, OnboardingTask, OnboardingTaskStatus } from "@/types";

interface OnboardingState {
  checklists: OnboardingChecklist[];
  completeTask: (checklistId: string, taskId: string) => void;
  addTask: (checklistId: string, task: Omit<OnboardingTask, "id">) => void;
  getChecklistForEmployee: (employeeId: string) => OnboardingChecklist | undefined;
  getCompletionPercent: (checklistId: string) => number;
}

function nextTaskId(checklist: OnboardingChecklist): string {
  const nums = checklist.tasks
    .map((t) => parseInt(t.id.replace("t", ""), 10))
    .filter((n) => !Number.isNaN(n));
  return `t${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      checklists: ONBOARDING_CHECKLISTS,

      completeTask: (checklistId, taskId) => {
        set((state) => ({
          checklists: state.checklists.map((cl) =>
            cl.id === checklistId
              ? {
                  ...cl,
                  tasks: cl.tasks.map((t) =>
                    t.id === taskId
                      ? { ...t, status: "Done" as OnboardingTaskStatus, completedOn: new Date().toISOString().slice(0, 10) }
                      : t
                  ),
                }
              : cl
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Onboarding Task Completed",
          module: "Onboarding",
          performedBy: "EMP020",
          target: taskId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Checklist ${checklistId}`,
        });
      },

      addTask: (checklistId, input) => {
        const checklist = get().checklists.find((c) => c.id === checklistId);
        if (!checklist) return;
        const id = nextTaskId(checklist);
        const task: OnboardingTask = {
          ...input,
          id,
          status: "Pending",
          completedOn: null,
        };
        set((state) => ({
          checklists: state.checklists.map((cl) =>
            cl.id === checklistId ? { ...cl, tasks: [...cl.tasks, task] } : cl
          ),
        }));
      },

      getChecklistForEmployee: (employeeId) =>
        get().checklists.find((c) => c.employeeId === employeeId),

      getCompletionPercent: (checklistId) => {
        const cl = get().checklists.find((c) => c.id === checklistId);
        if (!cl || cl.tasks.length === 0) return 0;
        const done = cl.tasks.filter((t) => t.status === "Done").length;
        return Math.round((done / cl.tasks.length) * 100);
      },
    }),
    { name: "hrms-onboarding", storage: createJSONStorage(() => localStorage) }
  )
);
