"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useHolidayStore } from "@/stores/holidayStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { formatDate } from "@/lib/formatters";
import type { Holiday } from "@/types";

const holidaySchema = z.object({
  name: z.string().min(1, "Name required"),
  date: z.string().min(1, "Date required"),
  type: z.string().min(1, "Type required"),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

const HOLIDAY_TYPES = ["National", "Festival", "Regional"];

export default function HolidaysPage() {
  const session = useAuthStore((s) => s.session);
  const holidays = useHolidayStore((s) => s.holidays);
  const addHoliday = useHolidayStore((s) => s.addHoliday);
  const updateHoliday = useHolidayStore((s) => s.updateHoliday);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [editId, setEditId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { name: "", date: "", type: "National" },
  });

  const holidayMap = useMemo(
    () => new Map(holidays.map((h) => [h.date, h])),
    [holidays]
  );

  const holidaysByYear = useMemo(
    () => holidays.filter((h) => h.date.startsWith(String(year))).sort((a, b) => a.date.localeCompare(b.date)),
    [holidays, year]
  );

  const onAddSubmit = form.handleSubmit((data) => {
    addHoliday(data);
    toast.success("Holiday added");
    setAddOpen(false);
    form.reset({ name: "", date: "", type: "National" });
  });

  const onEditSubmit = form.handleSubmit((data) => {
    if (!editId) return;
    updateHoliday(editId, data);
    toast.success("Holiday updated");
    setEditId(null);
  });

  const openEdit = (h: Holiday) => {
    setEditId(h.id);
    form.reset({ name: h.name, date: h.date, type: h.type });
  };

  const isHR = session?.role === "hr";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Calendar"
        description="View company holidays by year."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Year calendar grid */}
        <Card className="flex-1 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Year view</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setYear((y) => y - 1)}
              >
                Prev
              </Button>
              <span className="min-w-[80px] text-center font-medium">{year}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setYear((y) => y + 1)}
              >
                Next
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const start = startOfMonth(new Date(year, month - 1));
                const end = endOfMonth(start);
                const days = eachDayOfInterval({ start, end });
                const pad = start.getDay();
                return (
                  <div key={month} className="rounded-lg border border-slate-200 p-2">
                    <p className="mb-2 text-center text-sm font-medium text-slate-700">
                      {format(start, "MMMM")}
                    </p>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                        <div key={d} className="font-medium text-slate-400">
                          {d}
                        </div>
                      ))}
                      {Array.from({ length: pad }).map((_, i) => (
                        <div key={`pad-${i}`} />
                      ))}
                      {days.map((d) => {
                        const dateStr = format(d, "yyyy-MM-dd");
                        const h = holidayMap.get(dateStr);
                        return (
                          <div
                            key={dateStr}
                            className={`rounded p-0.5 ${
                              h
                                ? "bg-amber-400 text-amber-950 font-medium"
                                : "text-slate-600"
                            }`}
                            title={h ? h.name : undefined}
                          >
                            {format(d, "d")}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: list of holidays */}
        <Card className="w-full rounded-xl shadow-sm lg:w-[320px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Holidays in {year}</CardTitle>
            {isHR && (
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <CalendarPlus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add holiday</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={onAddSubmit} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {HOLIDAY_TYPES.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {holidaysByYear.length === 0 ? (
              <p className="text-sm text-slate-500">No holidays in {year}.</p>
            ) : (
              <ul className="space-y-2">
                {holidaysByYear.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-amber-50/50 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{h.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(h.date)} · {h.type}
                      </p>
                    </div>
                    {isHR && (
                      <Dialog
                        open={editId === h.id}
                        onOpenChange={(open) => !open && setEditId(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(h)}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit holiday</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={onEditSubmit} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {HOLIDAY_TYPES.map((t) => (
                                          <SelectItem key={t} value={t}>
                                            {t}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditId(null)}>
                                  Cancel
                                </Button>
                                <Button type="submit">Save</Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
