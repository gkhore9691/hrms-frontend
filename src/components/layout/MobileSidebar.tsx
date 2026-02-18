"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Users } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { NAV_CONFIG } from "@/lib/permissions";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const session = useAuthStore((s) => s.session);

  if (!session) return null;

  const navItems = NAV_CONFIG.filter((item) =>
    item.roles.includes(session.role)
  );

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[260px] p-0 bg-[#0F172A] border-r border-white/10">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
            <Users className="h-8 w-8 text-[#2563EB]" />
            <span className="font-display text-xl font-semibold text-white">
              PeopleOS
            </span>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-0.5 px-3">
              {navItems.map((item) => {
                const Icon = getIcon(item.icon);
                const isActive =
                  pathname === item.href ||
                  (item.children?.some((c) => c.href === pathname) ?? false);

                if (item.children) {
                  return (
                    <li key={item.href}>
                      <span
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                          isActive ? "bg-[#1E3A5F] text-white" : "text-slate-400"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </span>
                      <ul className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = getIcon(child.icon);
                          const childActive = pathname === child.href;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={close}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                                  childActive
                                    ? "bg-[#1E3A5F] text-white"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                              >
                                <ChildIcon className="h-4 w-4" />
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[#1E3A5F] text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
