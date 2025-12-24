"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Triggered by scheduler for one-time reminders
export const triggerOneTimeReminder = internalAction({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    // Find all pending one-time reminders that are due
    const now = Date.now();

    // Query and mark as pending_trigger (the agent will pick them up)
    await ctx.runMutation(internal.reminders.markDueRemindersAsPendingTrigger, {
      chatId,
      beforeTime: now + 60000, // Within the next minute
    });

    // Spawn the agent with reminder context
    await ctx.runAction(internal.agents.spawnAgentForReminders, { chatId });
  },
});

// Check recurring reminders (called by cron every minute)
export const checkRecurringReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all pending reminders that are due
    const dueReminders = await ctx.runQuery(internal.reminders.getDueReminders, {
      beforeTime: now,
    });

    // Group by chatId
    const remindersByChat = new Map<string, typeof dueReminders>();
    for (const reminder of dueReminders) {
      const existing = remindersByChat.get(reminder.chatId) ?? [];
      existing.push(reminder);
      remindersByChat.set(reminder.chatId, existing);
    }

    // For each chat with due reminders, spawn an agent
    // Process in parallel for better scalability
    const spawnPromises = Array.from(remindersByChat.entries()).map(
      async ([chatId, reminders]) => {
        // Check if agent is already active
        const isActive = await ctx.runQuery(
          internal.agentQueries.isAgentActiveInternal,
          { chatId }
        );

        // Mark reminders as pending_trigger
        await ctx.runMutation(internal.reminders.markRemindersAsPendingTrigger, {
          reminderIds: reminders.map((r) => r._id),
        });

        // Only spawn if no active agent (active agent will pick them up)
        if (!isActive) {
          await ctx.runAction(internal.agents.spawnAgentForReminders, { chatId });
        }
      }
    );

    // Wait for all spawns to complete (parallel execution)
    await Promise.all(spawnPromises);
  },
});
