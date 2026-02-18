"use client";

import { useState, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchPlaceholder?: string;
  pageSize?: number;
  searchKeys?: (keyof T)[];
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  showSearch?: boolean;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  searchPlaceholder = "Search...",
  pageSize = 10,
  searchKeys,
  emptyIcon,
  emptyTitle = "No data",
  emptyDescription = "Nothing to show here yet.",
  showSearch = true,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  const keysToSearch = searchKeys ?? (columns.map((c) => c.key) as (keyof T)[]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      keysToSearch.some((key) => {
        const val = (row as Record<string, unknown>)[key as string];
        return val != null && String(val).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, keysToSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedData = useMemo(
    () =>
      filteredData.slice(
        currentPage * pageSize,
        currentPage * pageSize + pageSize
      ),
    [filteredData, currentPage, pageSize]
  );

  if (data.length === 0) {
    const Icon = emptyIcon;
    return (
      <div className={cn("rounded-xl border bg-white p-6", className)}>
        {Icon ? (
          <EmptyState
            icon={Icon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="py-12 text-center text-slate-500">
            <p className="font-medium">{emptyTitle}</p>
            <p className="mt-1 text-sm">{emptyDescription}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showSearch && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
      )}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                {columns.map((col) => (
                  <TableHead key={col.key} className="font-semibold">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <TableRow
                  key={idx}
                  className="transition-colors hover:bg-slate-50/50 even:bg-slate-50/30"
                >
                    {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(row as T)
                        : String(((row as Record<string, unknown>)[col.key] as unknown) ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-slate-50/50 px-4 py-2">
            <p className="text-sm text-slate-600">
              Showing {currentPage * pageSize + 1}–
              {Math.min((currentPage + 1) * pageSize, filteredData.length)} of{" "}
              {filteredData.length}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
