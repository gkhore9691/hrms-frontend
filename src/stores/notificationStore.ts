import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Notification } from "@/types";

type NotificationInput = Omit<Notification, "id" | "read" | "createdAt"> & {
  read?: boolean;
  createdAt?: string;
};

interface NotificationState {
  notifications: Notification[];
  addNotification: (n: NotificationInput) => void;
  markRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getForUser: (userId: string) => Notification[];
}

function nextNotifId(notifs: Notification[]): string {
  const nums = notifs
    .map((n) => parseInt(n.id.replace("n", ""), 10))
    .filter((x) => !Number.isNaN(x));
  const max = nums.length ? Math.max(...nums) : 0;
  return `n${max + 1}`;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (input) => {
        const list = get().notifications;
        const id = nextNotifId(list);
        const notification: Notification = {
          id,
          userId: input.userId,
          title: input.title,
          message: input.message,
          read: input.read ?? false,
          createdAt: input.createdAt ?? new Date().toISOString(),
          link: input.link,
        };
        set({ notifications: [...list, notification] });
      },

      markRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllRead: (userId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n
          ),
        }));
      },

      getUnreadCount: (userId) => {
        return get().notifications.filter(
          (n) => n.userId === userId && !n.read
        ).length;
      },

      getForUser: (userId) => {
        return get()
          .notifications.filter((n) => n.userId === userId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      },
    }),
    { name: "hrms-notifications", storage: createJSONStorage(() => localStorage) }
  )
);
