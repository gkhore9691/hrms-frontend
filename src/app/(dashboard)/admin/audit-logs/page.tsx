"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStore } from "@/stores/adminStore";
import { useEmployeeStore } from "@/stores/employeeStore";
import { PageHeader } from "@/components/layout/PageHeader";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();
  const auditLogs = useAdminStore((s) => s.auditLogs);
  const users = useAdminStore((s) => s.users);
  const getById = useEmployeeStore((s) => s.getById);

  const performedByName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of users) {
      map[u.employeeId] = u.name;
    }
    return (id: string) => {
      if (map[id]) return map[id];
      const emp = getById(id);
      return emp ? emp.name : id;
    };
  }, [users, getById]);

  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [performedBy, setPerformedBy] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const modules = useMemo(
    () => [...new Set(auditLogs.map((l) => l.module))].sort(),
    [auditLogs]
  );
  const actions = useMemo(
    () => [...new Set(auditLogs.map((l) => l.action))].sort(),
    [auditLogs]
  );

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (moduleFilter !== "all" && log.module !== moduleFilter) return false;
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (performedBy.trim()) {
        const q = performedBy.trim().toLowerCase();
        const name = performedByName(log.performedBy).toLowerCase();
        const id = log.performedBy.toLowerCase();
        if (!name.includes(q) && !id.includes(q)) return false;
      }
      const ts = log.timestamp.slice(0, 10);
      if (dateFrom && ts < dateFrom) return false;
      if (dateTo && ts > dateTo) return false;
      return true;
    });
  }, [auditLogs, moduleFilter, actionFilter, dateFrom, dateTo, performedBy, performedByName]);

  const formatTimestamp = (ts: string) => {
    try {
      return format(new Date(ts.replace(" ", "T")), "dd MMM yyyy, HH:mm");
    } catch {
      return ts;
    }
  };

  if (!session) return null;
  if (session.role !== "hr") return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="View system activity (read-only)"
      />

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Module</span>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Action</span>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Date from</span>
            <Input
              type="date"
              className="w-[140px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Date to</span>
            <Input
              type="date"
              className="w-[140px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Performed by</span>
            <Input
              placeholder="Name or ID"
              className="w-[120px]"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Logs ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Performed by</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() =>
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }
                  >
                    <TableCell className="w-8">
                      {expandedId === log.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>{log.module}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      <span title={log.performedBy}>
                        {performedByName(log.performedBy)}
                      </span>
                      {performedByName(log.performedBy) !== log.performedBy && (
                        <span className="ml-1 text-slate-400 text-xs">
                          ({log.performedBy})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {log.target}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.details}
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && (
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={7} className="py-3 text-sm">
                        <div className="rounded border border-slate-200 bg-white p-3 font-mono text-xs">
                          <div><strong>ID:</strong> {log.id}</div>
                          <div><strong>Timestamp:</strong> {log.timestamp}</div>
                          <div><strong>Module:</strong> {log.module}</div>
                          <div><strong>Action:</strong> {log.action}</div>
                          <div><strong>Performed by:</strong> {performedByName(log.performedBy)} ({log.performedBy})</div>
                          <div><strong>Target:</strong> {log.target}</div>
                          <div><strong>Details:</strong> {log.details}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-slate-500">No logs match the filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
