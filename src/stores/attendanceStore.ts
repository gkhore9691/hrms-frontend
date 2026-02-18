import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ATTENDANCE_RECORDS } from "@/data/dummyData";
import { useAdminStore } from "@/stores/adminStore";
import type { AttendanceRecord, AttendanceStatus, RegularizationRequest } from "@/types";

interface AttendanceState {
  records: AttendanceRecord[];
  regularizations: RegularizationRequest[];
  checkIn: (employeeId: string) => void;
  checkOut: (employeeId: string) => void;
  getTodayStatus: (employeeId: string) => AttendanceRecord | null;
  getMonthly: (employeeId: string, year: number, month: number) => AttendanceRecord[];
  requestRegularization: (employeeId: string, date: string, reason: string) => void;
  approveRegularization: (id: string, approvedBy: string) => void;
  rejectRegularization: (id: string, approvedBy: string) => void;
}

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextRecordId(records: AttendanceRecord[]): string {
  const nums = records
    .map((r) => parseInt(r.id.replace("att", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `att${max + 1}`;
}

function nextRegId(regs: RegularizationRequest[]): string {
  const nums = regs
    .map((r) => parseInt(r.id.replace("reg", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `reg${max + 1}`;
}

function calcHours(checkIn: string, checkOut: string): number {
  const [cInH, cInM] = checkIn.split(":").map(Number);
  const [cOutH, cOutM] = checkOut.split(":").map(Number);
  let mins = (cOutH * 60 + cOutM) - (cInH * 60 + cInM);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      records: ATTENDANCE_RECORDS,
      regularizations: [],

      checkIn: (employeeId) => {
        const today = todayStr();
        const records = get().records;
        const existing = records.find(
          (r) => r.employeeId === employeeId && r.date === today
        );
        if (existing) return;
        const id = nextRecordId(records);
        const checkIn = nowTime();
        set({
          records: [
            ...records,
            {
              id,
              employeeId,
              date: today,
              checkIn,
              checkOut: null,
              status: "Present" as AttendanceStatus,
              hoursWorked: 0,
              overtime: 0,
              shiftId: "s1",
            },
          ],
        });
      },

      checkOut: (employeeId) => {
        const today = todayStr();
        set((state) => {
          const rec = state.records.find(
            (r) => r.employeeId === employeeId && r.date === today
          );
          if (!rec || !rec.checkIn) return state;
          const checkOut = nowTime();
          const hoursWorked = calcHours(rec.checkIn, checkOut);
          return {
            records: state.records.map((r) =>
              r.id === rec.id
                ? { ...r, checkOut, hoursWorked, overtime: Math.max(0, hoursWorked - 9) }
                : r
            ),
          };
        });
      },

      getTodayStatus: (employeeId) => {
        const today = todayStr();
        return get().records.find(
          (r) => r.employeeId === employeeId && r.date === today
        ) ?? null;
      },

      getMonthly: (employeeId, year, month) => {
        const prefix = `${year}-${String(month).padStart(2, "0")}`;
        return get().records.filter(
          (r) => r.employeeId === employeeId && r.date.startsWith(prefix)
        );
      },

      requestRegularization: (employeeId, date, reason) => {
        const regs = get().regularizations;
        const id = nextRegId(regs);
        set({
          regularizations: [
            ...regs,
            {
              id,
              employeeId,
              date,
              reason,
              status: "Pending",
              requestedOn: new Date().toISOString().slice(0, 10),
              approvedBy: null,
            },
          ],
        });
        useAdminStore.getState().addAuditLog({
          action: "Regularization Requested",
          module: "Attendance",
          performedBy: employeeId,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Request for ${date}`,
        });
      },

      approveRegularization: (id, approvedBy) => {
        const reg = get().regularizations.find((r) => r.id === id);
        if (!reg || reg.status !== "Pending") return;
        set((state) => ({
          regularizations: state.regularizations.map((r) =>
            r.id === id ? { ...r, status: "Approved", approvedBy } : r
          ),
          records: (() => {
            const recs = state.records.filter(
              (r) => r.employeeId === reg.employeeId && r.date === reg.date
            );
            if (recs.length > 0) {
              return state.records.map((r) =>
                r.id === recs[0].id
                  ? { ...r, status: "Present" as AttendanceStatus, checkIn: "09:00", checkOut: "18:00", hoursWorked: 9 }
                  : r
              );
            }
            const newId = nextRecordId(state.records);
            return [
              ...state.records,
              {
                id: newId,
                employeeId: reg.employeeId,
                date: reg.date,
                checkIn: "09:00",
                checkOut: "18:00",
                status: "Present" as AttendanceStatus,
                hoursWorked: 9,
                overtime: 0,
                shiftId: "s1",
              },
            ];
          })(),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Regularization Approved",
          module: "Attendance",
          performedBy: approvedBy,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Approved for ${reg.employeeId} on ${reg.date}`,
        });
      },

      rejectRegularization: (id, approvedBy) => {
        const reg = get().regularizations.find((r) => r.id === id);
        if (!reg || reg.status !== "Pending") return;
        set((state) => ({
          regularizations: state.regularizations.map((r) =>
            r.id === id ? { ...r, status: "Rejected", approvedBy } : r
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Regularization Rejected",
          module: "Attendance",
          performedBy: approvedBy,
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `Rejected for ${reg.employeeId} on ${reg.date}`,
        });
      },
    }),
    { name: "hrms-attendance", storage: createJSONStorage(() => localStorage) }
  )
);
