"use client";

import { useAuthStore } from "@/stores/authStore";
import { canAccess } from "@/lib/permissions";

interface RoleGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({ permission, fallback = null, children }: RoleGuardProps) {
  const session = useAuthStore((s) => s.session);
  if (!session || !canAccess(session.role, permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
