"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-indigo-500",
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(name: string, avatarOverride?: string): string {
  if (avatarOverride?.trim()) return avatarOverride.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface UserAvatarProps {
  name: string;
  avatar?: string;
  className?: string;
}

export function UserAvatar({ name, avatar, className }: UserAvatarProps) {
  const initials = getInitials(name, avatar);
  const colorIndex = hashString(name || "?") % AVATAR_COLORS.length;
  const bgClass = AVATAR_COLORS[colorIndex];

  return (
    <Avatar className={cn("border-2 border-white shadow-sm", className)}>
      <AvatarFallback
        className={cn("text-white text-sm font-medium", bgClass)}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
