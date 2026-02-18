"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStore } from "@/stores/adminStore";
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
import type { UserRole } from "@/types";

const addUserSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
  role: z.enum(["hr", "manager", "employee"]),
  employeeId: z.string().min(1, "Employee ID required"),
});

type AddUserValues = z.infer<typeof addUserSchema>;

export default function AdminUsersPage() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();
  const users = useAdminStore((s) => s.users);
  const roles = useAdminStore((s) => s.roles);
  const setUserRole = useAdminStore((s) => s.setUserRole);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRoleUserId, setEditRoleUserId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<string>("");

  useEffect(() => {
    if (session && session.role !== "hr") router.replace("/dashboard");
  }, [session, router]);

  const form = useForm<AddUserValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "employee", employeeId: "EMP000" },
  });

  const addUser = useAdminStore((s) => s.addUser);
  const handleCreate = (values: AddUserValues) => {
    const id = `u${String(users.length + 1)}`;
    addUser({
      id,
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role as UserRole,
      avatar: values.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      employeeId: values.employeeId,
    });
    toast.success("User created");
    form.reset();
    setCreateOpen(false);
  };

  const handleSaveRole = () => {
    if (!editRoleUserId || !editRoleId) return;
    setUserRole(editRoleUserId, editRoleId);
    toast.success("Role updated");
    setEditRoleUserId(null);
  };

  if (!session || session.role !== "hr") return null;

  const builtInRoleIds = roles.filter((r) => ["hr", "manager", "employee"].includes(r.id)).map((r) => r.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Create and manage users and their roles"
      />

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Users</CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add user
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem><FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {builtInRoleIds.map((rid) => {
                            const r = roles.find((x) => x.id === rid);
                            return r ? <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem> : null;
                          })}
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="employeeId" render={({ field }) => (
                    <FormItem><FormLabel>Employee ID</FormLabel><FormControl><Input {...field} placeholder="EMP001" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter><Button type="submit">Create</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{roles.find((r) => r.id === u.role)?.name ?? u.role}</TableCell>
                  <TableCell>{u.employeeId}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditRoleUserId(u.id);
                        setEditRoleId(u.role);
                      }}
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

      <Dialog open={!!editRoleUserId} onOpenChange={(open) => !open && setEditRoleUserId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              User: {users.find((u) => u.id === editRoleUserId)?.name}
            </p>
            <Select value={editRoleId} onValueChange={setEditRoleId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {builtInRoleIds.map((rid) => {
                  const r = roles.find((x) => x.id === rid);
                  return r ? <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem> : null;
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleUserId(null)}>Cancel</Button>
            <Button onClick={handleSaveRole}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
