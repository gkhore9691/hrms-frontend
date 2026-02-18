import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  LEAVE_TYPES,
  LEAVE_BALANCES,
  LEAVE_REQUESTS,
} from "@/data/dummyData";
import { useAdminStore } from "@/stores/adminStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import type {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
} from "@/types";

interface LeaveState {
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
  requests: LeaveRequest[];
  getBalance: (employeeId: string, leaveTypeId: string) => { used: number; balance: number };
  applyLeave: (request: Omit<LeaveRequest, "id" | "status" | "appliedOn" | "approvedBy" | "comments">) => void;
  approveLeave: (id: string, approvedBy: string, comments?: string) => void;
  rejectLeave: (id: string, comments?: string) => void;
  cancelLeave: (id: string) => void;
  updateLeaveType: (id: string, payload: Partial<LeaveType>) => void;
}

function nextRequestId(requests: LeaveRequest[]): string {
  const nums = requests
    .map((r) => parseInt(r.id.replace("lr", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `lr${max + 1}`;
}

export const useLeaveStore = create<LeaveState>()(
  persist(
    (set, get) => ({
      leaveTypes: LEAVE_TYPES,
      balances: LEAVE_BALANCES,
      requests: LEAVE_REQUESTS,

      getBalance: (employeeId, leaveTypeId) => {
        const b = get().balances.find(
          (x) => x.employeeId === employeeId && x.leaveTypeId === leaveTypeId
        );
        if (b) return { used: b.used, balance: b.balance };
        const type = get().leaveTypes.find((t) => t.id === leaveTypeId);
        return { used: 0, balance: type?.totalDays ?? 0 };
      },

      applyLeave: (input) => {
        const requests = get().requests;
        const id = nextRequestId(requests);
        const request: LeaveRequest = {
          ...input,
          id,
          status: "Pending",
          appliedOn: new Date().toISOString().slice(0, 10),
          approvedBy: null,
          comments: "",
        };
        set({ requests: [...requests, request] });
        useAdminStore.getState().addAuditLog({
          action: "Leave Applied",
          module: "Leave",
          performedBy: input.employeeId,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `${input.days} day(s) leave applied`,
        });
        const emp = useEmployeeStore.getState().getById(input.employeeId);
        const managerUserId = emp?.reportingManagerId
          ? useAdminStore.getState().getUserIdByEmployeeId(emp.reportingManagerId)
          : undefined;
        if (managerUserId) {
          useNotificationStore.getState().addNotification({
            userId: managerUserId,
            title: "Leave request submitted",
            message: `${emp?.name ?? "An employee"} applied for ${input.days} day(s) leave. Please review.`,
          });
        }
      },

      approveLeave: (id, approvedBy, comments = "") => {
        const req = get().requests.find((r) => r.id === id);
        if (!req || req.status !== "Pending") return;
        set((state) => {
          const requests = state.requests.map((r) =>
            r.id === id
              ? { ...r, status: "Approved" as LeaveRequestStatus, approvedBy, comments }
              : r
          );
          const existingBal = state.balances.find(
            (b) => b.employeeId === req.employeeId && b.leaveTypeId === req.leaveTypeId
          );
          const type = state.leaveTypes.find((t) => t.id === req.leaveTypeId);
          const totalDays = type?.totalDays ?? 0;
          let balances = state.balances.map((b) =>
            b.employeeId === req.employeeId && b.leaveTypeId === req.leaveTypeId
              ? { ...b, used: b.used + req.days, balance: b.balance - req.days }
              : b
          );
          if (!existingBal) {
            balances = [
              ...balances,
              {
                employeeId: req.employeeId,
                leaveTypeId: req.leaveTypeId,
                used: req.days,
                balance: totalDays - req.days,
              },
            ];
          }
          return { requests, balances };
        });
        useAdminStore.getState().addAuditLog({
          action: "Leave Approved",
          module: "Leave",
          performedBy: approvedBy,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Leave request approved for ${req.employeeId}`,
        });
        const empUserId = useAdminStore.getState().getUserIdByEmployeeId(req.employeeId);
        if (empUserId) {
          useNotificationStore.getState().addNotification({
            userId: empUserId,
            title: "Leave approved",
            message: `Your leave request (${req.days} day(s)) has been approved.`,
          });
        }
      },

      rejectLeave: (id, comments = "") => {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, status: "Rejected" as LeaveRequestStatus, comments } : r
          ),
        }));
        const req = get().requests.find((r) => r.id === id);
        if (req) {
          useAdminStore.getState().addAuditLog({
            action: "Leave Rejected",
            module: "Leave",
            performedBy: "EMP001",
            target: id,
            timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
            details: `Leave rejected for ${req.employeeId}`,
          });
          const empUserId = useAdminStore.getState().getUserIdByEmployeeId(req.employeeId);
          if (empUserId) {
            useNotificationStore.getState().addNotification({
              userId: empUserId,
              title: "Leave rejected",
              message: `Your leave request has been rejected.${comments ? ` Reason: ${comments}` : ""}`,
            });
          }
        }
      },

      cancelLeave: (id) => {
        const req = get().requests.find((r) => r.id === id);
        if (!req || req.status !== "Pending") return;
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Leave Cancelled",
          module: "Leave",
          performedBy: req.employeeId,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: "Pending leave cancelled",
        });
      },

      updateLeaveType: (id, payload) => {
        set((state) => ({
          leaveTypes: state.leaveTypes.map((t) =>
            t.id === id ? { ...t, ...payload } : t
          ),
        }));
      },
    }),
    { name: "hrms-leave", storage: createJSONStorage(() => localStorage) }
  )
);
