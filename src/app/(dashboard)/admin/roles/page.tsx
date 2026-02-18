"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, UserPlus, Users } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStore } from "@/stores/adminStore";
import { ALL_PERMISSION_KEYS, formatPermissionLabel } from "@/lib/permissions";

function formatModuleHeading(moduleKey: string): string {
  return moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1).toLowerCase();
}
import type { RolePermissions } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const createRoleSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().min(1, "Description required"),
  copyFromRoleId: z.string().optional(),
});

type CreateRoleValues = z.infer<typeof createRoleSchema>;

const BUILT_IN_ROLE_IDS = ["hr", "manager", "employee"];

function groupPermissionsByModule(keys: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const key of keys) {
    const module = key.split(".")[0] ?? "other";
    if (!groups[module]) groups[module] = [];
    groups[module].push(key);
  }
  return groups;
}

export default function AdminRolesPage() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();
  const roles = useAdminStore((s) => s.roles);
  const users = useAdminStore((s) => s.users);
  const updateRolePermissions = useAdminStore((s) => s.updateRolePermissions);
  const setUserRole = useAdminStore((s) => s.setUserRole);
  const addRole = useAdminStore((s) => s.addRole);
  const addAuditLog = useAdminStore((s) => s.addAuditLog);

  const [editRole, setEditRole] = useState<typeof roles[0] | null>(null);
  const [editPerms, setEditPerms] = useState<RolePermissions>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string>("");

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const form = useForm<CreateRoleValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: "", description: "", copyFromRoleId: "" },
  });

  const userCountByRole = (roleId: string) =>
    users.filter((u) => u.role === roleId).length;

  const permissionGroups = useMemo(
    () => groupPermissionsByModule(ALL_PERMISSION_KEYS),
    []
  );

  const openEdit = (role: typeof roles[0]) => {
    setEditRole(role);
    setEditPerms({ ...role.permissions });
    setAssignUserId("");
  };

  const handleSavePermissions = () => {
    if (!editRole) return;
    updateRolePermissions(editRole.id, editPerms);
    addAuditLog({
      action: "Role Updated",
      module: "Admin",
      performedBy: session?.employeeId ?? "unknown",
      target: editRole.id,
      timestamp: new Date().toISOString().slice(0, 19),
      details: `Permissions updated for ${editRole.name}`,
    });
    toast.success("Permissions updated");
    setEditRole(null);
  };

  const handleCreateRole = (values: CreateRoleValues) => {
    addRole(values.name, values.description, values.copyFromRoleId || undefined);
    toast.success("Role created");
    form.reset();
    setCreateOpen(false);
  };

  const setPerm = (key: string, value: boolean | string) => {
    setEditPerms((p) => ({ ...p, [key]: value }));
  };

  const usersInRole = useMemo(() => {
    if (!editRole) return [];
    return users.filter((u) => u.role === editRole.id);
  }, [users, editRole]);

  const usersNotInRole = useMemo(() => {
    if (!editRole) return [];
    return users.filter((u) => u.role !== editRole.id);
  }, [users, editRole]);

  const canAssignRole = editRole && BUILT_IN_ROLE_IDS.includes(editRole.id);

  const handleAssignUser = () => {
    if (!editRole || !assignUserId || !canAssignRole) return;
    setUserRole(assignUserId, editRole.id);
    addAuditLog({
      action: "User role assigned",
      module: "Admin",
      performedBy: session?.employeeId ?? "unknown",
      target: assignUserId,
      timestamp: new Date().toISOString().slice(0, 19),
      details: `Assigned ${editRole.name} to user`,
    });
    toast.success("User assigned to role");
    setAssignUserId("");
  };

  if (!session) return null;
  if (session.role !== "hr") return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage role permissions and assign users to roles"
      />

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Roles</CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Create role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create role</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateRole)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Contract Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Short description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="copyFromRoleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copy permissions from</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-slate-600">{role.description}</TableCell>
                  <TableCell>{userCountByRole(role.id)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(role)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden sm:max-w-2xl px-6 pt-6 pb-6"
        >
          <SheetHeader className="shrink-0 border-b pb-4 px-0">
            <SheetTitle className="text-lg">Edit {editRole?.name}</SheetTitle>
            {editRole && (
              <p className="text-sm text-slate-500">{editRole.description}</p>
            )}
          </SheetHeader>

          <Tabs defaultValue="permissions" className="flex min-h-0 flex-1 flex-col overflow-hidden px-0">
            <TabsList className="shrink-0 grid w-full grid-cols-2">
              <TabsTrigger value="permissions" className="gap-1.5">
                <Users className="h-4 w-4" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                Users ({editRole ? userCountByRole(editRole.id) : 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="min-h-0 flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full min-h-0 pr-4">
                <div className="space-y-6 pb-6">
                  {Object.entries(permissionGroups).map(([module, perms]) => (
                    <div key={module}>
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">
                        {formatModuleHeading(module)}
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2">
                        {perms.map((key) => {
                          const val = editPerms[key];
                          const checked = val !== false && val !== undefined;
                          return (
                            <label
                              key={key}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100/80"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(c) => setPerm(key, c === true)}
                              />
                              <span className="truncate">{formatPermissionLabel(key)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="users" className="min-h-0 flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full min-h-0 pr-4">
                <div className="space-y-4 pb-6">
                  {!canAssignRole ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Only built-in roles (HR Admin, Manager, Employee) can be assigned to users. Custom roles are for permission templates only.
                    </p>
                  ) : (
                    <>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <h4 className="mb-2 text-sm font-semibold text-slate-700">
                          Assign user to this role
                        </h4>
                        <div className="flex gap-2">
                          <Select
                            value={assignUserId}
                            onValueChange={setAssignUserId}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select a user…" />
                            </SelectTrigger>
                            <SelectContent>
                              {usersNotInRole.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name} ({u.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={handleAssignUser}
                            disabled={!assignUserId}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-slate-700">
                          Users in this role
                        </h4>
                        {usersInRole.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                            No users assigned yet. Use the dropdown above to assign.
                          </p>
                        ) : (
                          <ul className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2">
                            {usersInRole.map((u) => (
                              <li
                                key={u.id}
                                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-slate-50"
                              >
                                <span>
                                  {u.name}
                                  <span className="ml-1 text-slate-500">({u.email})</span>
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {u.employeeId}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <SheetFooter className="shrink-0 border-t pt-4 mt-4 px-0 bg-background">
            <Button variant="outline" onClick={() => setEditRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>Save permissions</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
