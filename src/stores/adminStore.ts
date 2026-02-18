import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ROLES, AUDIT_LOGS, USERS } from "@/data/dummyData";
import type { AuditLog, Role, RolePermissions, User } from "@/types";

type AuditLogInput = Omit<AuditLog, "id">;

interface AdminState {
  roles: Role[];
  auditLogs: AuditLog[];
  users: User[];
  getUserIdByEmployeeId: (employeeId: string) => string | undefined;
  updateRolePermissions: (roleId: string, permissions: RolePermissions) => void;
  addRole: (name: string, description: string, copyFromRoleId?: string) => void;
  setUserRole: (userId: string, roleId: string) => void;
  addUser: (user: User) => void;
  addAuditLog: (entry: AuditLogInput) => void;
}

function nextAuditId(logs: AuditLog[]): string {
  const nums = logs
    .map((l) => parseInt(l.id.replace("al", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `al${max + 1}`;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      roles: ROLES,
      auditLogs: AUDIT_LOGS,
      users: USERS,

      getUserIdByEmployeeId: (employeeId) =>
        get().users.find((u) => u.employeeId === employeeId)?.id,

      setUserRole: (userId, roleId) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, role: roleId as User["role"] } : u
          ),
        }));
      },

      addUser: (user) => {
        set((state) => ({ users: [...state.users, user] }));
        get().addAuditLog({
          action: "User Created",
          module: "Admin",
          performedBy: "EMP001",
          target: user.id,
          timestamp: new Date().toISOString().slice(0, 19),
          details: user.email,
        });
      },

      updateRolePermissions: (roleId, permissions) => {
        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === roleId ? { ...r, permissions } : r
          ),
        }));
      },

      addRole: (name, description, copyFromRoleId) => {
        const state = get();
        const source = copyFromRoleId
          ? state.roles.find((r) => r.id === copyFromRoleId)
          : null;
        const permissions: RolePermissions = source
          ? { ...source.permissions }
          : {};
        const nextNum =
          state.roles
            .filter((r) => r.id.startsWith("custom"))
            .map((r) => parseInt(r.id.replace("custom", "") || "0", 10))
            .filter((n) => !Number.isNaN(n))
            .reduce((a, b) => Math.max(a, b), 0) + 1;
        const newRole: Role = {
          id: `custom${nextNum}`,
          name,
          description,
          permissions,
          usersCount: 0,
        };
        set({ roles: [...state.roles, newRole] });
      },

      addAuditLog: (entry) => {
        const logs = get().auditLogs;
        const id = nextAuditId(logs);
        set({
          auditLogs: [...logs, { ...entry, id }],
        });
      },
    }),
    { name: "hrms-admin", storage: createJSONStorage(() => localStorage) }
  )
);
