"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useEmployeeStore } from "@/stores/employeeStore";
import { useAuthStore } from "@/stores/authStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { RoleGuard } from "@/components/common/RoleGuard";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users, LayoutGrid, List, Mail, Phone } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { DEPARTMENTS } from "@/data/dummyData";
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from "@/lib/constants";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const session = useAuthStore((s) => s.session);
  const employees = useEmployeeStore((s) => s.employees);
  const getTeam = useEmployeeStore((s) => s.getTeam);

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employmentFilter, setEmploymentFilter] = useState<string>("all");

  const visibleEmployees = useMemo(() => {
    let list =
      session?.role === "hr"
        ? employees
        : session?.role === "manager"
          ? getTeam(session.employeeId)
          : employees;
    if (deptFilter !== "all") list = list.filter((e) => e.department === deptFilter);
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (employmentFilter !== "all") list = list.filter((e) => e.employmentType === employmentFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.id.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term)
      );
    }
    return list;
  }, [session, employees, getTeam, search, deptFilter, statusFilter, employmentFilter]);

  const columns: { key: string; label: string; render?: (row: Employee) => React.ReactNode }[] = [
    {
      key: "id",
      label: "Employee",
      render: (row) => (
        <Link
          href={`/employees/${row.id}`}
          className="flex items-center gap-3 font-medium text-primary hover:underline"
        >
          <UserAvatar name={row.name} />
          <span>{row.name}</span>
          <span className="text-slate-400 text-sm">{row.id}</span>
        </Link>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (row) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {row.department}
        </span>
      ),
    },
    { key: "designation", label: "Designation" },
    {
      key: "dateOfJoining",
      label: "Date of Joining",
      render: (row) => formatDate(row.dateOfJoining),
    },
    {
      key: "workLocation",
      label: "Work Location",
      render: (row) => (
        <span className="flex items-center gap-1 text-sm">
          <span className="text-slate-400">📍</span> {row.workLocation}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/employees/${row.id}`}>View</Link>
          </Button>
          <RoleGuard permission="employees.edit">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/employees/${row.id}?tab=personal`}>Edit</Link>
            </Button>
          </RoleGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee records and directory."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border p-1">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <RoleGuard permission="employees.create">
              <Button asChild size="sm">
                <Link href="/employees/add">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Employee
                </Link>
              </Button>
            </RoleGuard>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder="Search by name, ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-3"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d.id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {EMPLOYEE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={employmentFilter} onValueChange={setEmploymentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Employment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {EMPLOYMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === "table" ? (
        <DataTable<Employee>
          columns={columns}
          data={visibleEmployees}
          searchPlaceholder="Search..."
          searchKeys={["name", "id", "email"]}
          showSearch={false}
          emptyIcon={Users}
          emptyTitle="No employees"
          emptyDescription="Try adjusting filters or add your first employee."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEmployees.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Users}
                title="No employees"
                description="Try adjusting filters or add your first employee."
              />
            </div>
          ) : (
            visibleEmployees.map((emp) => (
              <Card
                key={emp.id}
                className="rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <CardContent className="p-4">
                  <Link
                    href={`/employees/${emp.id}`}
                    className="flex flex-col items-center text-center gap-3"
                  >
                    <UserAvatar name={emp.name} className="h-14 w-14" />
                    <div>
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <p className="text-sm text-slate-500">{emp.designation}</p>
                      <p className="text-xs text-slate-400 mt-1">{emp.department}</p>
                    </div>
                    <StatusBadge status={emp.status} />
                  </Link>
                  <div className="mt-3 flex justify-center gap-2 text-slate-500">
                    <a href={`mailto:${emp.email}`} className="hover:text-primary" aria-label="Email">
                      <Mail className="h-4 w-4" />
                    </a>
                    <a href={`tel:${emp.phone}`} className="hover:text-primary" aria-label="Phone">
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/employees/${emp.id}`}>View</Link>
                    </Button>
                    <RoleGuard permission="employees.edit">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/employees/${emp.id}?tab=personal`}>Edit</Link>
                      </Button>
                    </RoleGuard>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {viewMode === "grid" && visibleEmployees.length > 0 && (
        <p className="text-sm text-slate-500">
          Showing {visibleEmployees.length} employee{visibleEmployees.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
