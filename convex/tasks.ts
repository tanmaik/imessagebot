import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";

// ============= Internal functions (for agent) =============

// Get all tasks for a chat
export const getTasksForChat = internalQuery({
  args: {
    chatId: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, status }) => {
    let tasks;
    if (status) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("chatId", chatId).eq("status", status))
        .collect();
    } else {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
        .collect();
    }

    return tasks.map((t) => ({
      id: t._id,
      type: t.type,
      title: t.title,
      description: t.description,
      dueAt: t.dueAt,
      eventAt: t.eventAt,
      status: t.status,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    }));
  },
});

// Get a single task by ID
export const getTask = internalQuery({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId);
    if (!task) return null;

    return {
      id: task._id,
      chatId: task.chatId,
      type: task.type,
      title: task.title,
      description: task.description,
      dueAt: task.dueAt,
      eventAt: task.eventAt,
      status: task.status,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    };
  },
});

// Create a new task
export const createTask = internalMutation({
  args: {
    chatId: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    eventAt: v.optional(v.number()),
  },
  handler: async (ctx, { chatId, type, title, description, dueAt, eventAt }) => {
    const taskId = await ctx.db.insert("tasks", {
      chatId,
      type,
      title,
      description,
      dueAt,
      eventAt,
      status: "active",
      createdAt: Date.now(),
    });

    return { taskId };
  },
});

// Update a task
export const updateTask = internalMutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    eventAt: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { taskId, title, description, dueAt, eventAt, status }) => {
    const task = await ctx.db.get(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueAt !== undefined) updates.dueAt = dueAt;
    if (eventAt !== undefined) updates.eventAt = eventAt;
    if (status !== undefined) {
      updates.status = status;
      if (status === "completed") {
        updates.completedAt = Date.now();
      }
    }

    await ctx.db.patch(taskId, updates);

    // If task is completed or cancelled, cancel all pending reminders
    if (status === "completed" || status === "cancelled") {
      const reminders = await ctx.db
        .query("scheduledReminders")
        .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
        .collect();

      for (const reminder of reminders) {
        if (reminder.status === "pending") {
          await ctx.db.patch(reminder._id, { status: "cancelled" });
          // Cancel the scheduled function if it exists
          if (reminder.scheduledFunctionId) {
            try {
              await ctx.scheduler.cancel(reminder.scheduledFunctionId as never);
            } catch {
              // Already executed or cancelled
            }
          }
        }
      }
    }

    return { success: true };
  },
});

// Delete a task and all its reminders
export const deleteTask = internalMutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Delete all reminders for this task
    const reminders = await ctx.db
      .query("scheduledReminders")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .collect();

    for (const reminder of reminders) {
      // Cancel scheduled function if exists
      if (reminder.scheduledFunctionId) {
        try {
          await ctx.scheduler.cancel(reminder.scheduledFunctionId as never);
        } catch {
          // Already executed or cancelled
        }
      }
      await ctx.db.delete(reminder._id);
    }

    // Delete the task
    await ctx.db.delete(taskId);

    return { success: true };
  },
});

// ============= Public functions (for dashboard API) =============

// List all tasks for a chat (with reminders)
export const listTasks = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .collect();

    // Get reminders for each task
    const tasksWithReminders = await Promise.all(
      tasks.map(async (task) => {
        const reminders = await ctx.db
          .query("scheduledReminders")
          .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
          .collect();

        return {
          id: task._id,
          type: task.type,
          title: task.title,
          description: task.description,
          dueAt: task.dueAt,
          eventAt: task.eventAt,
          status: task.status,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
          reminders: reminders.map((r) => ({
            id: r._id,
            reminderType: r.reminderType,
            triggerAt: r.triggerAt,
            cronSchedule: r.cronSchedule,
            nextTriggerAt: r.nextTriggerAt,
            reminderPurpose: r.reminderPurpose,
            status: r.status,
            lastTriggeredAt: r.lastTriggeredAt,
          })),
        };
      })
    );

    return tasksWithReminders;
  },
});

// Update task from dashboard
export const updateTaskFromDashboard = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    eventAt: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const patchData: Record<string, unknown> = {};
    if (updates.title !== undefined) patchData.title = updates.title;
    if (updates.description !== undefined) patchData.description = updates.description;
    if (updates.dueAt !== undefined) patchData.dueAt = updates.dueAt;
    if (updates.eventAt !== undefined) patchData.eventAt = updates.eventAt;
    if (updates.status !== undefined) {
      patchData.status = updates.status;
      if (updates.status === "completed") {
        patchData.completedAt = Date.now();
      }
    }

    await ctx.db.patch(taskId, patchData);

    // If task is completed or cancelled, cancel pending reminders
    if (updates.status === "completed" || updates.status === "cancelled") {
      const reminders = await ctx.db
        .query("scheduledReminders")
        .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
        .collect();

      for (const reminder of reminders) {
        if (reminder.status === "pending") {
          await ctx.db.patch(reminder._id, { status: "cancelled" });
        }
      }
    }
  },
});

// Delete task from dashboard
export const deleteTaskFromDashboard = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Delete all reminders
    const reminders = await ctx.db
      .query("scheduledReminders")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .collect();

    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id);
    }

    // Delete task
    await ctx.db.delete(taskId);
  },
});
