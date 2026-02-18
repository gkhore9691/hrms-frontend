import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { USERS } from "@/data/dummyData";
import type { Session } from "@/types";
import { useAdminStore } from "@/stores/adminStore";

function getUsers() {
  return useAdminStore.getState().users?.length ? useAdminStore.getState().users : USERS;
}

interface AuthState {
  session: Session | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,

      login: (email, password) => {
        const users = getUsers();
        const user = users.find((u) => u.email === email && u.password === password);
        if (!user) return false;
        const session: Session = {
          userId: user.id,
          role: user.role,
          name: user.name,
          employeeId: user.employeeId,
        };
        set({ session });
        return true;
      },

      logout: () => set({ session: null }),
    }),
    { name: "hrms-auth", storage: createJSONStorage(() => localStorage) }
  )
);
