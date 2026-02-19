import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ONBOARDING_CHECKLISTS } from "@/data/dummyData";
import { useAdminStore } from "@/stores/adminStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { formatDate } from "@/lib/formatters";
import type { OnboardingChecklist, OnboardingTask, OnboardingTaskStatus } from "@/types";

interface OnboardingState {
  checklists: OnboardingChecklist[];
  completeTask: (checklistId: string, taskId: string) => void;
  addTask: (checklistId: string, task: Omit<OnboardingTask, "id">) => void;
  assignChecklist: (employeeId: string) => void;
  checkOverdueTasks: () => void;
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

      assignChecklist: (employeeId) => {
        const today = new Date();
        const addDays = (d: number) =>
          new Date(today.getTime() + d * 86400000).toISOString().split("T")[0];
        const base = Date.now();
        const newChecklist: OnboardingChecklist = {
          id: `ob-${base}`,
          employeeId,
          assignedOn: today.toISOString().split("T")[0],
          tasks: [
            { id: `t-${base}-1`, title: "Submit Pre-joining Form", category: "HR", status: "Pending", dueDate: addDays(5), completedOn: null },
            { id: `t-${base}-2`, title: "Upload KYC Documents", category: "HR", status: "Pending", dueDate: addDays(7), completedOn: null },
            { id: `t-${base}-3`, title: "IT Setup & Laptop Assignment", category: "IT", status: "Pending", dueDate: addDays(3), completedOn: null },
            { id: `t-${base}-4`, title: "Bank Account Details Submission", category: "Finance", status: "Pending", dueDate: addDays(10), completedOn: null },
            { id: `t-${base}-5`, title: "Policy Acceptance", category: "Compliance", status: "Pending", dueDate: addDays(7), completedOn: null },
            { id: `t-${base}-6`, title: "ID Card Collection", category: "Admin", status: "Pending", dueDate: addDays(14), completedOn: null },
          ],
        };
        set((state) => ({ checklists: [...state.checklists, newChecklist] }));
        useAdminStore.getState().addAuditLog({
          action: "Onboarding Checklist Assigned",
          module: "Onboarding",
          performedBy: "EMP001",
          target: employeeId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Checklist assigned to employee ${employeeId}`,
        });
      },

      checkOverdueTasks: () => {
        const today = new Date().toISOString().split("T")[0];
        const notifStore = useNotificationStore.getState();
        const adminStore = useAdminStore.getState();
        get().checklists.forEach((checklist) => {
          checklist.tasks.forEach((task) => {
            if (task.status === "Pending" && task.dueDate < today) {
              const userId = adminStore.getUserIdByEmployeeId(checklist.employeeId);
              if (!userId) return;
              const existing = notifStore.notifications.find(
                (n) => n.link === `/onboarding/${checklist.id}` && n.title.includes("Overdue")
              );
              if (!existing) {
                notifStore.addNotification({
                  userId,
                  title: "Onboarding Task Overdue",
                  message: `"${task.title}" was due on ${formatDate(task.dueDate)}`,
                  link: `/onboarding/${checklist.id}`,
                });
              }
            }
          });
        });
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
