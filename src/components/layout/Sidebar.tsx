"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <TooltipProvider delayDuration={0}>
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-14 flex-col border-r border-white/10 md:flex xl:w-[260px]"
        style={{ backgroundColor: "#0F172A" }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center gap-2 border-b border-white/10 px-0 xl:justify-start xl:px-6">
          <Users className="h-8 w-8 shrink-0 text-[#2563EB]" />
          <span className="hidden font-display text-xl font-semibold text-white xl:inline">
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CollapsibleTrigger asChild>
                          <span
                            className={cn(
                              "flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer xl:justify-start",
                              isActive
                                ? "bg-[#1E3A5F] text-white border-l-4 border-[#2563EB] -ml-[4px] pl-[calc(0.75rem+4px)] xl:pl-[calc(0.75rem+4px)]"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="hidden xl:inline">{item.label}</span>
                          </span>
                        </CollapsibleTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                    <CollapsibleContent>
                      <ul className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3 xl:ml-4">
                        {item.children.map((child) => {
                          const ChildIcon = getIcon(child.icon);
                          const childActive = pathname === child.href;
                          return (
                            <li key={child.href}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={child.href}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors xl:gap-2",
                                      childActive
                                        ? "bg-[#1E3A5F] text-white"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                  >
                                    <ChildIcon className="h-4 w-4 shrink-0" />
                                    <span className="hidden xl:inline">{child.label}</span>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">{child.label}</TooltipContent>
                              </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors xl:justify-start",
                        isActive
                          ? "bg-[#1E3A5F] text-white border-l-4 border-[#2563EB] -ml-[4px] pl-[calc(0.75rem+4px)] xl:pl-[calc(0.75rem+4px)]"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User card */}
      <div className="border-t border-white/10 p-2 xl:p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center gap-3 rounded-lg px-3 py-2 xl:justify-start">
              <Avatar className="h-9 w-9 shrink-0 border-2 border-white/20">
                <AvatarFallback className="bg-[#1E3A5F] text-sm text-white">
                  {session.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-1 min-w-0 xl:block">
                <p className="truncate text-sm font-medium text-white">
                  {session.name}
                </p>
                <p className="truncate text-xs text-slate-400 capitalize">
                  {session.role}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{session.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{session.role}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-center text-slate-400 hover:bg-white/5 hover:text-white xl:justify-start"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline">Logout</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </div>
    </aside>
    </TooltipProvider>
  );
}
