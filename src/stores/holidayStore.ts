import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { HOLIDAYS as INITIAL_HOLIDAYS } from "@/data/dummyData";
import type { Holiday } from "@/types";

interface HolidayState {
  holidays: Holiday[];
  addHoliday: (holiday: Omit<Holiday, "id">) => void;
  updateHoliday: (id: string, payload: Partial<Omit<Holiday, "id">>) => void;
}

function nextId(holidays: Holiday[]): string {
  const nums = holidays
    .map((h) => parseInt(h.id.replace("h", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `h${max + 1}`;
}

export const useHolidayStore = create<HolidayState>()(
  persist(
    (set, get) => ({
      holidays: INITIAL_HOLIDAYS,

      addHoliday: (input) => {
        const id = nextId(get().holidays);
        set((state) => ({
          holidays: [...state.holidays, { ...input, id }],
        }));
      },

      updateHoliday: (id, payload) => {
        set((state) => ({
          holidays: state.holidays.map((h) =>
            h.id === id ? { ...h, ...payload } : h
          ),
        }));
      },
    }),
    { name: "hrms-holidays", storage: createJSONStorage(() => localStorage) }
  )
);
