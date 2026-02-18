import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { HELPDESK_TICKETS } from "@/data/dummyData";
import { useAdminStore } from "@/stores/adminStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type { HelpdeskTicket, TicketComment, TicketStatus } from "@/types";

type TicketInput = Omit<
  HelpdeskTicket,
  "id" | "ticketNo" | "raisedOn" | "resolvedOn" | "comments" | "dueBy"
> & { comments?: TicketComment[] };

interface HelpdeskState {
  tickets: HelpdeskTicket[];
  raiseTicket: (input: TicketInput) => void;
  assignTicket: (ticketId: string, assigneeId: string | null) => void;
  addComment: (ticketId: string, comment: Omit<TicketComment, "date"> & { date?: string }) => void;
  updateStatus: (ticketId: string, status: TicketStatus) => void;
  resolveTicket: (ticketId: string) => void;
  reopenTicket: (ticketId: string) => void;
  markPaidInPayroll: (ticketId: string) => void;
}

function nextTicketNo(tickets: HelpdeskTicket[]): string {
  const nums = tickets
    .map((t) => parseInt(t.ticketNo.replace("TKT-", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `TKT-${String(next).padStart(3, "0")}`;
}

export const useHelpdeskStore = create<HelpdeskState>()(
  persist(
    (set, get) => ({
      tickets: HELPDESK_TICKETS,

      raiseTicket: (input) => {
        const tickets = get().tickets;
        const ticketNo = nextTicketNo(tickets);
        const id = `hd${tickets.length + 1}`;
        const raisedOn = new Date().toISOString().slice(0, 10);
        const slaDays = input.priority === "High" ? 2 : input.priority === "Medium" ? 5 : 7;
        const dueDate = new Date(raisedOn);
        dueDate.setDate(dueDate.getDate() + slaDays);
        const dueBy = dueDate.toISOString().slice(0, 10);
        const ticket: HelpdeskTicket = {
          ...input,
          id,
          ticketNo,
          assignedTo: null,
          raisedOn,
          dueBy,
          resolvedOn: null,
          comments: input.comments ?? [],
        };
        set({ tickets: [...tickets, ticket] });
        useAdminStore.getState().addAuditLog({
          action: "Ticket Raised",
          module: "Helpdesk",
          performedBy: input.raisedBy,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: input.subject,
        });
        const hrUser = useAdminStore.getState().users.find((u) => u.role === "hr");
        if (hrUser) {
          useNotificationStore.getState().addNotification({
            userId: hrUser.id,
            title: "New helpdesk ticket",
            message: `${input.subject} (${ticketNo})`,
          });
        }
      },

      assignTicket: (ticketId, assigneeId) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, assignedTo: assigneeId || null } : t
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: assigneeId ? "Ticket Assigned" : "Ticket Unassigned",
          module: "Helpdesk",
          performedBy: "EMP001",
          target: ticketId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: assigneeId ? `Assigned to ${assigneeId}` : "Assignee cleared",
        });
        if (assigneeId) {
          const assigneeUserId = useAdminStore.getState().getUserIdByEmployeeId(assigneeId);
          const ticket = get().tickets.find((t) => t.id === ticketId);
          if (assigneeUserId && ticket) {
            useNotificationStore.getState().addNotification({
              userId: assigneeUserId,
              title: "Ticket assigned to you",
              message: `${ticket.ticketNo}: ${ticket.subject}`,
            });
          }
        }
      },

      addComment: (ticketId, comment) => {
        const c: TicketComment = {
          author: comment.author,
          text: comment.text,
          date: comment.date ?? new Date().toISOString().slice(0, 10),
        };
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, comments: [...t.comments, c] } : t
          ),
        }));
      },

      updateStatus: (ticketId, status) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status,
                  resolvedOn: status === "Resolved" || status === "Closed" ? new Date().toISOString().slice(0, 10) : null,
                }
              : t
          ),
        }));
      },

      resolveTicket: (ticketId) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: "Resolved" as TicketStatus,
                  resolvedOn: new Date().toISOString().slice(0, 10),
                }
              : t
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Ticket Resolved",
          module: "Helpdesk",
          performedBy: "EMP001",
          target: ticketId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: "Ticket resolved",
        });
      },

      reopenTicket: (ticketId) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? { ...t, status: "Open" as TicketStatus, resolvedOn: null }
              : t
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Ticket Reopened",
          module: "Helpdesk",
          performedBy: "EMP001",
          target: ticketId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: "Ticket reopened",
        });
      },

      markPaidInPayroll: (ticketId) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? { ...t, paidInPayroll: true, status: "Resolved" as TicketStatus, resolvedOn: new Date().toISOString().slice(0, 10) }
              : t
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Reimbursement added to payroll",
          module: "Helpdesk",
          performedBy: "EMP001",
          target: ticketId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: "Marked as paid in payroll",
        });
      },
    }),
    { name: "hrms-helpdesk", storage: createJSONStorage(() => localStorage) }
  )
);
