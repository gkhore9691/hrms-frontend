"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff, Users } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const QUICK_LOGINS = [
  { label: "Login as HR Admin", email: "admin@hrms.com", password: "admin123" },
  { label: "Login as Manager", email: "manager@hrms.com", password: "mgr123" },
  { label: "Login as Employee", email: "emp@hrms.com", password: "emp123" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@hrms.com", password: "", remember: false },
  });

  const onSubmit = (values: LoginFormValues) => {
    const ok = login(values.email, values.password);
    if (ok) router.push("/dashboard");
    else form.setError("password", { message: "Invalid email or password" });
  };

  const handleQuickLogin = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
    const ok = login(email, password);
    if (ok) router.push("/dashboard");
    else form.setError("password", { message: "Invalid email or password" });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Branded panel */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 bg-[#0F172A] text-white"
        style={{ backgroundColor: "#0F172A" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-10 w-10 text-[#2563EB]" />
            <span className="font-display text-2xl font-bold tracking-tight">
              PeopleOS
            </span>
          </div>
          <p className="text-slate-400 text-lg max-w-sm">
            Human Resource Management — one place for people, payroll, and
            performance.
          </p>
        </div>
        {/* Abstract HR illustration: simple shapes */}
        <div className="relative h-64 w-full max-w-md">
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#1E3A5F] opacity-60" />
          <div className="absolute bottom-8 right-0 w-40 h-40 rounded-2xl bg-[#2563EB] opacity-40" />
          <div className="absolute top-4 left-1/3 w-24 h-24 rounded-full bg-[#2563EB] opacity-30" />
          <div className="absolute top-16 right-1/4 w-16 h-16 rounded-lg bg-slate-500 opacity-20" />
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">
            Sign in
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Use your company credentials or try a quick login below.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@hrms.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Remember me
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg">
                Sign In
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3">Quick login (demo)</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_LOGINS.map(({ label, email, password }) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin(email, password)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
