"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface Reminder {
  id: string;
  reminderType: string;
  triggerAt?: number;
  cronSchedule?: string;
  nextTriggerAt?: number;
  reminderPurpose: string;
  status: string;
  lastTriggeredAt?: number;
}

interface Task {
  id: string;
  type: string;
  title: string;
  description?: string;
  dueAt?: number;
  eventAt?: number;
  status: string;
  createdAt: number;
  completedAt?: number;
  reminders: Reminder[];
}

interface NotificationsListProps {
  token: string;
}

// iMessage colors with additional status colors
const colors = {
  light: {
    bg: "#FFFFFF",
    cardBg: "#F2F2F7",
    text: "#000000",
    textSecondary: "rgba(0,0,0,0.5)",
    border: "rgba(0,0,0,0.1)",
    accent: "#007AFF",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
  },
  dark: {
    bg: "#000000",
    cardBg: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.1)",
    accent: "#0A84FF",
    success: "#30D158",
    warning: "#FF9F0A",
    danger: "#FF453A",
  },
};

const typeLabels: Record<string, string> = {
  todo: "To-Do",
  homework: "Homework",
  event: "Event",
  reminder: "Reminder",
};

const typeIcons: Record<string, string> = {
  todo: "✓",
  homework: "📚",
  event: "📅",
  reminder: "⏰",
};

const statusColors = (theme: typeof colors.light) => ({
  active: theme.accent,
  completed: theme.success,
  cancelled: theme.textSecondary,
  pending: theme.warning,
  triggered: theme.success,
});

export function NotificationsList({ token }: NotificationsListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const theme = isDark ? colors.dark : colors.light;
  const statusColorMap = statusColors(theme);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleMarkComplete = async (taskId: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          status: "completed",
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      fetchTasks();
    } catch {
      alert("Failed to mark as complete");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this task and all its reminders?")) return;

    try {
      const res = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      alert("Failed to delete task");
    }
  };

  const handleCancelReminder = async (reminderId: string) => {
    try {
      const res = await fetch("/api/tasks/reminders", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reminderId,
          status: "cancelled",
        }),
      });

      if (!res.ok) throw new Error("Failed to cancel reminder");
      fetchTasks();
    } catch {
      alert("Failed to cancel reminder");
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatCron = (cron: string) => {
    // Simple cron to human readable
    const parts = cron.split(" ");
    if (parts.length !== 5) return cron;

    const [min, hour, , , dow] = parts;
    const time = `${hour}:${min.padStart(2, "0")}`;

    if (dow === "*") return `Daily at ${time}`;
    const days: Record<string, string> = {
      "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed",
      "4": "Thu", "5": "Fri", "6": "Sat",
      SUN: "Sun", MON: "Mon", TUE: "Tue", WED: "Wed",
      THU: "Thu", FRI: "Fri", SAT: "Sat",
    };
    return `${days[dow.toUpperCase()] || dow} at ${time}`;
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "active") return task.status === "active";
    if (filter === "completed") return task.status === "completed" || task.status === "cancelled";
    return true;
  });

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div
          className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent"
          style={{
            borderColor: theme.accent,
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="text-center">
          <p className="text-red-500 mb-4 text-sm">{error}</p>
          <Button onClick={fetchTasks} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Filter tabs */}
      <div
        className="flex gap-2 mb-4 p-1 rounded-lg"
        style={{ backgroundColor: theme.cardBg }}
      >
        {(["active", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 py-2 rounded-md text-[14px] font-medium capitalize"
            style={{
              backgroundColor: filter === f ? theme.accent : "transparent",
              color: filter === f ? "#FFFFFF" : theme.textSecondary,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div
          className="flex items-center justify-center h-32 text-[15px]"
          style={{ color: theme.textSecondary }}
        >
          {filter === "active" ? "No active tasks" : filter === "completed" ? "No completed tasks" : "No tasks yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: theme.cardBg }}
            >
              {/* Task header */}
              <button
                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[16px]">{typeIcons[task.type] || "📌"}</span>
                      <span
                        className="text-[15px] font-medium"
                        style={{
                          color: theme.text,
                          textDecoration: task.status === "completed" ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: theme.textSecondary }}>
                      <span>{typeLabels[task.type] || task.type}</span>
                      {task.dueAt && (
                        <>
                          <span>•</span>
                          <span>Due {formatDateTime(task.dueAt)}</span>
                        </>
                      )}
                      {task.eventAt && (
                        <>
                          <span>•</span>
                          <span>{formatDateTime(task.eventAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[12px] px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: theme.border,
                      color: statusColorMap[task.status as keyof typeof statusColorMap] || theme.textSecondary,
                    }}
                  >
                    {task.status}
                  </span>
                </div>

                {/* Reminder count indicator */}
                {task.reminders.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-[12px]" style={{ color: theme.textSecondary }}>
                    <span>⏰</span>
                    <span>
                      {task.reminders.filter((r) => r.status === "pending").length} pending reminder
                      {task.reminders.filter((r) => r.status === "pending").length !== 1 ? "s" : ""}
                    </span>
                    <span style={{ marginLeft: "auto", opacity: 0.5 }}>
                      {expandedTaskId === task.id ? "▲" : "▼"}
                    </span>
                  </div>
                )}
              </button>

              {/* Expanded content */}
              {expandedTaskId === task.id && (
                <div
                  className="px-4 pb-4 pt-0"
                  style={{ borderTop: `1px solid ${theme.border}` }}
                >
                  {/* Description */}
                  {task.description && (
                    <p
                      className="text-[14px] mt-3 mb-3"
                      style={{ color: theme.textSecondary }}
                    >
                      {task.description}
                    </p>
                  )}

                  {/* Reminders */}
                  {task.reminders.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                        Reminders
                      </p>
                      {task.reminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg"
                          style={{ backgroundColor: theme.bg }}
                        >
                          <div>
                            <p className="text-[14px]" style={{ color: theme.text }}>
                              {reminder.reminderPurpose}
                            </p>
                            <p className="text-[12px]" style={{ color: theme.textSecondary }}>
                              {reminder.reminderType === "recurring" && reminder.cronSchedule
                                ? formatCron(reminder.cronSchedule)
                                : reminder.nextTriggerAt
                                ? formatDateTime(reminder.nextTriggerAt)
                                : "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] px-1.5 py-0.5 rounded capitalize"
                              style={{
                                backgroundColor: theme.border,
                                color: statusColorMap[reminder.status as keyof typeof statusColorMap] || theme.textSecondary,
                              }}
                            >
                              {reminder.status}
                            </span>
                            {reminder.status === "pending" && (
                              <button
                                onClick={() => handleCancelReminder(reminder.id)}
                                className="text-[12px]"
                                style={{ color: theme.danger }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    {task.status === "active" && (
                      <button
                        onClick={() => handleMarkComplete(task.id)}
                        className="flex-1 py-2 rounded-lg text-[14px] font-medium"
                        style={{ backgroundColor: theme.success, color: "#FFFFFF" }}
                      >
                        Mark Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="py-2 px-4 rounded-lg text-[14px]"
                      style={{ color: theme.danger }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Meta */}
                  <p className="text-[11px] mt-3" style={{ color: theme.textSecondary }}>
                    Created {formatDate(task.createdAt)}
                    {task.completedAt && ` • Completed ${formatDate(task.completedAt)}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
