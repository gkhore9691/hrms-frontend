import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EMPLOYEES } from "@/data/dummyData";
import { useAdminStore } from "@/stores/adminStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import type { Employee, EmployeeDocument } from "@/types";

interface EmployeeState {
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, payload: Partial<Employee>) => void;
  addDocument: (employeeId: string, doc: { name: string; type: string }) => void;
  deactivateEmployee: (id: string) => void;
  getById: (id: string) => Employee | undefined;
  getTeam: (managerId: string) => Employee[];
}

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      employees: EMPLOYEES,

      addEmployee: (employee) => {
        set((state) => ({
          employees: [...state.employees, employee],
        }));
        useOnboardingStore.getState().assignChecklist(employee.id);
        useAdminStore.getState().addAuditLog({
          action: "Employee Created",
          module: "Employee",
          performedBy: "EMP001",
          target: employee.id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: `New employee ${employee.name} added`,
        });
      },

      updateEmployee: (id, payload) => {
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, ...payload } : e
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Employee Updated",
          module: "Employee",
          performedBy: "EMP001",
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: "Employee record updated",
        });
      },

      addDocument: (employeeId, doc) => {
        const emp = get().employees.find((e) => e.id === employeeId);
        if (!emp) return;
        const newDoc: EmployeeDocument = {
          id: `doc-${employeeId}-${Date.now()}`,
          name: doc.name,
          type: doc.type,
          uploadedOn: new Date().toISOString().slice(0, 10),
          status: "Pending",
        };
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === employeeId ? { ...e, documents: [...e.documents, newDoc] } : e
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Document Uploaded",
          module: "Employee",
          performedBy: "EMP001",
          target: employeeId,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: doc.name,
        });
      },

      deactivateEmployee: (id) => {
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, status: "Inactive" as const } : e
          ),
        }));
        useAdminStore.getState().addAuditLog({
          action: "Employee Deactivated",
          module: "Employee",
          performedBy: "EMP001",
          target: id,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", "T"),
          details: "Employee marked inactive",
        });
      },

      getById: (id) => get().employees.find((e) => e.id === id),

      getTeam: (managerId) =>
        get().employees.filter((e) => e.reportingManagerId === managerId),
    }),
    { name: "hrms-employees", storage: createJSONStorage(() => localStorage) }
  )
);
