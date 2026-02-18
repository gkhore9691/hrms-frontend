"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuthStore } from "@/stores/authStore";
import { NAV_CONFIG } from "@/lib/permissions";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  const pathname = usePathname();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);

  if (!session) return null;

  const navItems = NAV_CONFIG.filter((item) =>
    item.roles.includes(session.role)
  );

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-white/10 md:flex"
      style={{ backgroundColor: "#0F172A" }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <Users className="h-8 w-8 text-[#2563EB]" />
        <span className="font-display text-xl font-semibold text-white">
          PeopleOS
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive =
              pathname === item.href ||
              (item.children?.some((c) => c.href === pathname) ?? false);

            if (item.children) {
              const isOpen = item.children.some((c) => c.href === pathname);
              return (
                <Collapsible key={item.href} defaultOpen={isOpen}>
                  <li>
                    <CollapsibleTrigger asChild>
                      <span
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                          isActive
                            ? "bg-[#1E3A5F] text-white border-l-4 border-[#2563EB] -ml-[4px] pl-[calc(0.75rem+4px)]"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = getIcon(child.icon);
                          const childActive = pathname === child.href;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
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
                    </CollapsibleContent>
                  </li>
                </Collapsible>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#1E3A5F] text-white border-l-4 border-[#2563EB] -ml-[4px] pl-[calc(0.75rem+4px)]"
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

      {/* User card */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-9 w-9 border-2 border-white/20">
            <AvatarFallback className="bg-[#1E3A5F] text-sm text-white">
              {session.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {session.name}
            </p>
            <p className="truncate text-xs text-slate-400 capitalize">
              {session.role}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-slate-400 hover:bg-white/5 hover:text-white"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
