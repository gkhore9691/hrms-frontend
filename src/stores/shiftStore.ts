import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SHIFTS } from "@/data/dummyData";
import type { Shift, ShiftAssignment } from "@/types";

interface ShiftState {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  updateShift: (id: string, payload: Partial<Shift>) => void;
  addAssignment: (assignment: ShiftAssignment) => void;
  getAssignment: (employeeId: string, asOfDate?: string) => Shift | undefined;
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      shifts: SHIFTS,
      assignments: [],

      updateShift: (id, payload) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === id ? { ...s, ...payload } : s
          ),
        }));
      },

      addAssignment: (assignment) => {
        set((state) => ({
          assignments: [...state.assignments.filter((a) => a.employeeId !== assignment.employeeId || a.effectiveFrom !== assignment.effectiveFrom), assignment],
        }));
      },

      getAssignment: (employeeId, asOfDate) => {
        const date = asOfDate ?? new Date().toISOString().slice(0, 10);
        const matches = get().assignments
          .filter((a) => a.employeeId === employeeId && a.effectiveFrom <= date)
          .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
        const latest = matches[0];
        if (!latest) return undefined;
        return get().shifts.find((s) => s.id === latest.shiftId);
      },
    }),
    { name: "hrms-shifts", storage: createJSONStorage(() => localStorage) }
  )
);
