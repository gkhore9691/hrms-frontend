"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MobileSidebar } from "./MobileSidebar";
import { formatDistanceToNow } from "date-fns";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Employees",
  "/employees/add": "Add Employee",
  "/employees/org-chart": "Org Chart",
  "/recruitment": "Recruitment",
  "/onboarding": "Onboarding",
  "/attendance": "Attendance",
  "/attendance/shifts": "Shift Management",
  "/leave": "Leave",
  "/leave/holidays": "Holidays",
  "/payroll": "Payroll",
  "/payroll/salary-structures": "Salary Structures",
  "/payroll/payslips": "Payslips",
  "/performance": "Performance",
  "/helpdesk": "Helpdesk",
  "/reports": "Reports",
  "/ess": "Self Service",
  "/profile": "Profile",
  "/admin/roles": "Roles & Permissions",
  "/admin/audit-logs": "Audit Logs",
  "/admin/notifications": "Notification Setup",
  "/admin/users": "User Management",
  "/training": "Training",
  "/benefits": "Benefits",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/employees/") && !pathname.endsWith("/add") && !pathname.endsWith("/org-chart"))
    return "Employee";
  if (pathname.startsWith("/recruitment/")) return "Recruitment";
  return "Dashboard";
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const allNotifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const handleNotificationClick = (n: (typeof allNotifications)[0]) => {
    markRead(n.id);
    if (n.link) router.push(n.link);
    setNotifOpen(false);
  };

  const userId = session?.userId ?? "";
  const notifications = useMemo(
    () =>
      allNotifications
        .filter((n) => n.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [allNotifications, userId]
  );
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const openMobile = () => {
    setMobileOpen(true);
    onMenuClick?.();
  };

  if (!session) return null;

  const title = getPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={openMobile}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-lg font-semibold text-slate-900">
          {title}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="font-medium">Notifications</span>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => session && markAllRead(session.userId)}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`w-full border-b px-3 py-2.5 text-left text-sm hover:bg-slate-50 ${!n.read ? "bg-primary/5" : ""}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <p className="font-medium text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {session.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  useAuthStore.getState().logout();
                  window.location.href = "/login";
                }}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  );
}
