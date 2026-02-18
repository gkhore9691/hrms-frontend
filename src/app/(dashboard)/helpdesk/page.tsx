"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LifeBuoy, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useHelpdeskStore } from "@/stores/helpdeskStore";
import { canAccess } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import type { TicketPriority } from "@/types";

const raiseSchema = z.object({
  category: z.string().min(1, "Select category"),
  subject: z.string().min(2, "Subject required"),
  description: z.string().min(5, "Description required"),
  priority: z.enum(["High", "Medium", "Low"]),
});

type RaiseValues = z.infer<typeof raiseSchema>;

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

export default function HelpdeskPage() {
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? "";
  const getTeam = useEmployeeStore((s) => s.getTeam);
  const getById = useEmployeeStore((s) => s.getById);
  const employees = useEmployeeStore((s) => s.employees);
  const tickets = useHelpdeskStore((s) => s.tickets);
  const raiseTicket = useHelpdeskStore((s) => s.raiseTicket);
  const assignTicket = useHelpdeskStore((s) => s.assignTicket);
  const addComment = useHelpdeskStore((s) => s.addComment);
  const updateStatus = useHelpdeskStore((s) => s.updateStatus);
  const resolveTicket = useHelpdeskStore((s) => s.resolveTicket);
  const reopenTicket = useHelpdeskStore((s) => s.reopenTicket);
  const markPaidInPayroll = useHelpdeskStore((s) => s.markPaidInPayroll);

  const [raiseOpen, setRaiseOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const canManage = session ? canAccess(session.role, "helpdesk.manage") : false;
  const teamIds = useMemo(() => {
    if (session?.role !== "manager" || !session?.employeeId) return new Set<string>();
    return new Set(getTeam(session.employeeId).map((e) => e.id));
  }, [session?.role, session?.employeeId, getTeam]);

  const visibleTickets = useMemo(() => {
    if (session?.role === "employee") return tickets.filter((t) => t.raisedBy === employeeId);
    if (session?.role === "manager") return tickets.filter((t) => teamIds.has(t.raisedBy));
    return tickets;
  }, [tickets, session?.role, employeeId, teamIds]);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTickets = useMemo(() => {
    if (session?.role === "employee") return visibleTickets;
    return visibleTickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (assigneeFilter !== "all" && t.assignedTo !== assigneeFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [visibleTickets, session?.role, statusFilter, categoryFilter, assigneeFilter, priorityFilter]);

  const raiseForm = useForm<RaiseValues>({
    resolver: zodResolver(raiseSchema),
    defaultValues: { category: "", subject: "", description: "", priority: "Medium" },
  });

  const onRaise = raiseForm.handleSubmit((data) => {
    if (!employeeId) return;
    raiseTicket({
      raisedBy: employeeId,
      assignedTo: null,
      category: data.category,
      subject: data.subject,
      description: data.description,
      status: "Open",
      priority: data.priority as TicketPriority,
    });
    toast.success("Ticket raised");
    setRaiseOpen(false);
    raiseForm.reset();
  });

  const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedId), [tickets, selectedId]);
  const canComment = selectedTicket && (selectedTicket.raisedBy === employeeId || canManage || (session?.role === "manager" && teamIds.has(selectedTicket.raisedBy)));

  const onAddComment = () => {
    if (!selectedId || !commentText.trim() || !canComment) return;
    addComment(selectedId, { author: employeeId ?? "", text: commentText.trim() });
    setCommentText("");
    toast.success("Comment added");
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Helpdesk"
        description={session.role === "employee" ? "Raise and track your tickets" : "View and manage tickets"}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setRaiseOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Raise New Ticket
        </Button>
        {(session.role === "hr" || session.role === "manager") && (
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {TICKET_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {TICKET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {TICKET_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No tickets"
          description={visibleTickets.length === 0 ? "Raise a ticket to get help." : "No tickets match the filters."}
          action={{ label: "Raise New Ticket", onClick: () => setRaiseOpen(true) }}
        />
      ) : (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>SLA due</TableHead>
                  {(session.role === "hr" || session.role === "manager") && <TableHead>Assignee</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedId(t.id)}
                  >
                    <TableCell className="font-medium">{t.ticketNo}</TableCell>
                    <TableCell>{t.subject}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[t.priority]}`}>
                        {t.priority}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell>{formatDate(t.raisedOn)}</TableCell>
                    <TableCell className="text-slate-600">{t.dueBy ? formatDate(t.dueBy) : "—"}</TableCell>
                    {(session.role === "hr" || session.role === "manager") && (
                      <TableCell>{t.assignedTo ? getById(t.assignedTo)?.name ?? t.assignedTo : "—"}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Raise ticket modal */}
      <Dialog open={raiseOpen} onOpenChange={setRaiseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Raise new ticket</DialogTitle></DialogHeader>
          <Form {...raiseForm}>
            <form onSubmit={onRaise} className="space-y-4">
              <FormField control={raiseForm.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>{TICKET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={raiseForm.control} name="subject" render={({ field }) => (
                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={raiseForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={raiseForm.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{TICKET_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <DialogFooter><Button type="button" variant="outline" onClick={() => setRaiseOpen(false)}>Cancel</Button><Button type="submit">Raise</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Ticket detail (Sheet / inline) */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTicket.ticketNo} · {selectedTicket.subject}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{selectedTicket.description}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedTicket.status} />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[selectedTicket.priority]}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className="text-xs text-slate-500">Raised by {getById(selectedTicket.raisedBy)?.name ?? selectedTicket.raisedBy} on {formatDate(selectedTicket.raisedOn)}</span>
                  {selectedTicket.dueBy && (
                    <span className="text-xs text-slate-500">SLA due {formatDate(selectedTicket.dueBy)}</span>
                  )}
                  {selectedTicket.assignedTo && (
                    <span className="text-xs text-slate-500">Assigned to {getById(selectedTicket.assignedTo)?.name ?? selectedTicket.assignedTo}</span>
                  )}
                </div>

                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={selectedTicket.assignedTo ?? "unassigned"}
                      onValueChange={(v) => assignTicket(selectedTicket.id, v === "unassigned" ? null : v)}
                    >
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Assign to" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {selectedTicket.status !== "In Progress" && selectedTicket.status !== "Resolved" && selectedTicket.status !== "Closed" && (
                      <Button size="sm" variant="outline" onClick={() => { updateStatus(selectedTicket.id, "In Progress"); toast.success("Status updated"); }}>In Progress</Button>
                    )}
                    {selectedTicket.status !== "Resolved" && selectedTicket.status !== "Closed" && (
                      <Button size="sm" variant="outline" onClick={() => { resolveTicket(selectedTicket.id); toast.success("Resolved"); }}>Resolve</Button>
                    )}
                    {(selectedTicket.status === "Resolved" || selectedTicket.status === "Closed") && (
                      <Button size="sm" variant="outline" onClick={() => { reopenTicket(selectedTicket.id); toast.success("Reopened"); }}>Reopen</Button>
                    )}
                    {selectedTicket.status === "Resolved" && (
                      <Button size="sm" variant="outline" onClick={() => { updateStatus(selectedTicket.id, "Closed"); toast.success("Closed"); }}>Close</Button>
                    )}
                    {selectedTicket.category === "Reimbursement" && !selectedTicket.paidInPayroll && selectedTicket.status !== "Closed" && (
                      <Button size="sm" variant="secondary" onClick={() => { markPaidInPayroll(selectedTicket.id); toast.success("Marked as paid in payroll"); }}>Mark as paid in payroll</Button>
                    )}
                  </div>
                )}
                {selectedTicket.category === "Reimbursement" && selectedTicket.paidInPayroll && (
                  <p className="text-sm text-emerald-600 font-medium">Paid in payroll</p>
                )}

                <div>
                  <p className="mb-2 font-medium text-slate-700">Comments</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedTicket.comments.length === 0 ? (
                      <p className="text-sm text-slate-500">No comments yet.</p>
                    ) : (
                      selectedTicket.comments.map((c, i) => (
                        <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm">
                          <p className="font-medium text-slate-700">{getById(c.author)?.name ?? c.author}</p>
                          <p className="text-slate-600">{c.text}</p>
                          <p className="text-xs text-slate-400">{c.date}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {canComment && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="resize-none"
                    />
                    <Button size="sm" onClick={onAddComment} disabled={!commentText.trim()}>Send</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
