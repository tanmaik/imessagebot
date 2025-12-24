import { v } from "convex/values";
import { internalQuery, internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ============= Timezone & Cron parsing helpers =============

// Common US timezone offsets (hours from UTC)
// Note: These are standard time offsets. For simplicity, we use fixed offsets.
// The agent should ask for timezone and store it as a memory.
const TIMEZONE_OFFSETS: Record<string, number> = {
  // US timezones
  "America/Los_Angeles": -8,  // PST (PDT is -7)
  "America/Denver": -7,       // MST
  "America/Chicago": -6,      // CST
  "America/New_York": -5,     // EST
  // Aliases
  "PST": -8, "PDT": -7,
  "MST": -7, "MDT": -6,
  "CST": -6, "CDT": -5,
  "EST": -5, "EDT": -4,
  "UTC": 0, "GMT": 0,
};

// Get timezone offset in milliseconds
function getTimezoneOffsetMs(timezone: string | undefined): number {
  if (!timezone) return -8 * 60 * 60 * 1000; // Default to PST
  const hours = TIMEZONE_OFFSETS[timezone] ?? TIMEZONE_OFFSETS["America/Los_Angeles"];
  return hours * 60 * 60 * 1000;
}

// Parse cron expression and calculate next trigger time
// Supports: minute hour dayOfMonth month dayOfWeek
// Examples: "0 9 * * *" (daily at 9am), "0 9 * * MON" (Mondays at 9am)
// IMPORTANT: Cron times are in the USER'S timezone, not UTC
function parseNextCronTime(
  cronSchedule: string,
  timezone: string | undefined,
  fromTime: number = Date.now()
): number {
  const parts = cronSchedule.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Invalid cron format. Expected: minute hour dayOfMonth month dayOfWeek");
  }

  const [minuteStr, hourStr, , , dayOfWeekStr] = parts;

  // Parse minute and hour (simple case - exact values only for now)
  const targetMinute = minuteStr === "*" ? 0 : parseInt(minuteStr, 10);
  const targetHour = hourStr === "*" ? 0 : parseInt(hourStr, 10);

  // Parse day of week
  const dayMap: Record<string, number> = {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
    "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
  };
  const targetDayOfWeek = dayOfWeekStr === "*" ? null : dayMap[dayOfWeekStr.toUpperCase()];

  // Convert current time to user's timezone for comparison
  const tzOffsetMs = getTimezoneOffsetMs(timezone);

  // Get current time in user's timezone (as if it were UTC)
  const nowInUserTz = new Date(fromTime + tzOffsetMs);

  // Build candidate time in user's timezone
  const candidate = new Date(nowInUserTz);
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(targetMinute);
  candidate.setUTCHours(targetHour);

  // If today's time has passed in user's timezone, move to tomorrow
  if (candidate.getTime() <= nowInUserTz.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }

  // If we have a specific day of week, find the next matching day
  if (targetDayOfWeek !== null) {
    while (candidate.getUTCDay() !== targetDayOfWeek) {
      candidate.setUTCDate(candidate.getUTCDate() + 1);
    }
  }

  // Convert back from user's timezone to UTC
  return candidate.getTime() - tzOffsetMs;
}

// ============= Internal functions (for agent) =============

// Get reminders for a task
export const getRemindersForTask = internalQuery({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const reminders = await ctx.db
      .query("scheduledReminders")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .collect();

    return reminders.map((r) => ({
      id: r._id,
      reminderType: r.reminderType,
      triggerAt: r.triggerAt,
      cronSchedule: r.cronSchedule,
      nextTriggerAt: r.nextTriggerAt,
      reminderPurpose: r.reminderPurpose,
      status: r.status,
      lastTriggeredAt: r.lastTriggeredAt,
    }));
  },
});

// Add a reminder to a task
export const addReminder = internalMutation({
  args: {
    taskId: v.id("tasks"),
    chatId: v.string(),
    reminderType: v.string(),
    reminderPurpose: v.string(),
    triggerAt: v.optional(v.number()),
    cronSchedule: v.optional(v.string()),
    timezone: v.optional(v.string()), // Optional - will auto-fetch from chat if not provided
  },
  handler: async (ctx, { taskId, chatId, reminderType, reminderPurpose, triggerAt, cronSchedule, timezone }) => {
    // Validate task exists
    const task = await ctx.db.get(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Auto-fetch timezone from chat if not provided
    let effectiveTimezone = timezone;
    if (!effectiveTimezone) {
      const chat = await ctx.db
        .query("chats")
        .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
        .first();
      effectiveTimezone = chat?.timezone ?? undefined;
    }

    let nextTriggerAt: number | undefined;
    let scheduledFunctionId: string | undefined;

    if (reminderType === "one_time") {
      if (!triggerAt) {
        return { success: false, error: "triggerAt required for one_time reminders" };
      }
      // Schedule the trigger function
      const scheduledId = await ctx.scheduler.runAt(
        triggerAt,
        internal.reminderActions.triggerOneTimeReminder,
        { chatId }
      );
      scheduledFunctionId = scheduledId as unknown as string;
      nextTriggerAt = triggerAt;
    } else if (reminderType === "recurring") {
      if (!cronSchedule) {
        return { success: false, error: "cronSchedule required for recurring reminders" };
      }
      if (!effectiveTimezone) {
        return { success: false, error: "timezone required for recurring reminders - use setTimezone() first or pass timezone explicitly" };
      }
      // Calculate next trigger time from cron (using user's timezone from chat or passed in)
      nextTriggerAt = parseNextCronTime(cronSchedule, effectiveTimezone);
    }

    const reminderId = await ctx.db.insert("scheduledReminders", {
      taskId,
      chatId,
      reminderType,
      triggerAt,
      scheduledFunctionId,
      cronSchedule,
      timezone: effectiveTimezone,
      nextTriggerAt,
      reminderPurpose,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true, reminderId };
  },
});

// Update a reminder
export const updateReminder = internalMutation({
  args: {
    reminderId: v.id("scheduledReminders"),
    reminderPurpose: v.optional(v.string()),
    triggerAt: v.optional(v.number()),
    cronSchedule: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { reminderId, reminderPurpose, triggerAt, cronSchedule, status }) => {
    const reminder = await ctx.db.get(reminderId);
    if (!reminder) {
      return { success: false, error: "Reminder not found" };
    }

    const updates: Record<string, unknown> = {};
    if (reminderPurpose !== undefined) updates.reminderPurpose = reminderPurpose;
    if (status !== undefined) updates.status = status;

    // Handle trigger time updates
    if (triggerAt !== undefined && reminder.reminderType === "one_time") {
      updates.triggerAt = triggerAt;
      updates.nextTriggerAt = triggerAt;

      // Cancel old scheduled function and create new one
      if (reminder.scheduledFunctionId) {
        try {
          await ctx.scheduler.cancel(reminder.scheduledFunctionId as never);
        } catch {
          // Already executed
        }
      }

      const scheduledId = await ctx.scheduler.runAt(
        triggerAt,
        internal.reminderActions.triggerOneTimeReminder,
        { chatId: reminder.chatId }
      );
      updates.scheduledFunctionId = scheduledId as unknown as string;
    }

    if (cronSchedule !== undefined && reminder.reminderType === "recurring") {
      updates.cronSchedule = cronSchedule;
      // Use the stored timezone when recalculating next trigger
      updates.nextTriggerAt = parseNextCronTime(cronSchedule, reminder.timezone);
    }

    // If cancelling, cancel any scheduled function
    if (status === "cancelled" && reminder.scheduledFunctionId) {
      try {
        await ctx.scheduler.cancel(reminder.scheduledFunctionId as never);
      } catch {
        // Already executed
      }
    }

    await ctx.db.patch(reminderId, updates);
    return { success: true };
  },
});

// Delete a reminder
export const deleteReminder = internalMutation({
  args: {
    reminderId: v.id("scheduledReminders"),
  },
  handler: async (ctx, { reminderId }) => {
    const reminder = await ctx.db.get(reminderId);
    if (!reminder) {
      return { success: false, error: "Reminder not found" };
    }

    // Cancel scheduled function if exists
    if (reminder.scheduledFunctionId) {
      try {
        await ctx.scheduler.cancel(reminder.scheduledFunctionId as never);
      } catch {
        // Already executed
      }
    }

    await ctx.db.delete(reminderId);
    return { success: true };
  },
});

// ============= Trigger functions =============

// Get pending_trigger reminders for a chat (used by agent before terminating)
export const getPendingTriggerReminders = internalQuery({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const reminders = await ctx.db
      .query("scheduledReminders")
      .withIndex("by_pending_trigger", (q) =>
        q.eq("chatId", chatId).eq("status", "pending_trigger")
      )
      .collect();

    // Get task info for each reminder
    const remindersWithTasks = await Promise.all(
      reminders.map(async (r) => {
        const task = await ctx.db.get(r.taskId);
        return {
          _id: r._id,
          taskId: r.taskId,
          taskTitle: task?.title ?? "Unknown task",
          taskType: task?.type ?? "unknown",
          reminderPurpose: r.reminderPurpose,
          dueAt: task?.dueAt,
          eventAt: task?.eventAt,
        };
      })
    );

    return remindersWithTasks;
  },
});

// Mark reminders as triggered
export const markRemindersTriggered = internalMutation({
  args: {
    reminderIds: v.array(v.id("scheduledReminders")),
  },
  handler: async (ctx, { reminderIds }) => {
    for (const reminderId of reminderIds) {
      const reminder = await ctx.db.get(reminderId);
      if (reminder) {
        if (reminder.reminderType === "one_time") {
          // One-time reminders are done after triggering
          await ctx.db.patch(reminderId, {
            status: "triggered",
            lastTriggeredAt: Date.now(),
          });
        } else if (reminder.reminderType === "recurring" && reminder.cronSchedule) {
          // Recurring reminders get rescheduled (using stored timezone)
          const nextTriggerAt = parseNextCronTime(reminder.cronSchedule, reminder.timezone);
          await ctx.db.patch(reminderId, {
            status: "pending",
            lastTriggeredAt: Date.now(),
            nextTriggerAt,
          });
        }
      }
    }
  },
});

// Mark due reminders as pending_trigger
export const markDueRemindersAsPendingTrigger = internalMutation({
  args: {
    chatId: v.string(),
    beforeTime: v.number(),
  },
  handler: async (ctx, { chatId, beforeTime }) => {
    const reminders = await ctx.db
      .query("scheduledReminders")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .collect();

    for (const reminder of reminders) {
      if (
        reminder.status === "pending" &&
        reminder.nextTriggerAt &&
        reminder.nextTriggerAt <= beforeTime
      ) {
        await ctx.db.patch(reminder._id, { status: "pending_trigger" });
      }
    }
  },
});

// Get due reminders
export const getDueReminders = internalQuery({
  args: {
    beforeTime: v.number(),
  },
  handler: async (ctx, { beforeTime }) => {
    // Get all pending reminders
    const reminders = await ctx.db
      .query("scheduledReminders")
      .withIndex("by_nextTrigger", (q) => q.eq("status", "pending"))
      .collect();

    // Filter to those that are due
    return reminders
      .filter((r) => r.nextTriggerAt && r.nextTriggerAt <= beforeTime)
      .map((r) => ({
        _id: r._id,
        chatId: r.chatId,
        taskId: r.taskId,
        reminderPurpose: r.reminderPurpose,
      }));
  },
});

// Mark reminders as pending_trigger
export const markRemindersAsPendingTrigger = internalMutation({
  args: {
    reminderIds: v.array(v.id("scheduledReminders")),
  },
  handler: async (ctx, { reminderIds }) => {
    for (const reminderId of reminderIds) {
      await ctx.db.patch(reminderId, { status: "pending_trigger" });
    }
  },
});

// ============= Public functions (for dashboard) =============

// Cancel a reminder from dashboard
export const cancelReminderFromDashboard = mutation({
  args: {
    reminderId: v.id("scheduledReminders"),
  },
  handler: async (ctx, { reminderId }) => {
    const reminder = await ctx.db.get(reminderId);
    if (!reminder) {
      throw new Error("Reminder not found");
    }

    await ctx.db.patch(reminderId, { status: "cancelled" });
  },
});
