"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStore } from "@/stores/adminStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminNotificationsPage() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();
  const users = useAdminStore((s) => s.users);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [targetUserId, setTargetUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session && session.role !== "hr") router.replace("/dashboard");
  }, [session, router]);

  const handleSendTest = () => {
    if (!targetUserId || !title.trim()) {
      toast.error("Select a user and enter a title");
      return;
    }
    addNotification({
      userId: targetUserId,
      title: title.trim(),
      message: message.trim() || "Test notification from Admin.",
    });
    toast.success("Notification sent");
    setTitle("");
    setMessage("");
  };

  if (!session || session.role !== "hr") return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Setup"
        description="Send test notifications and configure alerts"
      />

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Send test notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium">Send to user</label>
            <Select value={targetUserId} onValueChange={setTargetUserId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              className="mt-1"
              placeholder="e.g. Leave approved"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Message (optional)</label>
            <Input
              className="mt-1"
              placeholder="Notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button onClick={handleSendTest} disabled={!targetUserId || !title.trim()}>
            Send notification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
