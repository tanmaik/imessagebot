"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { createChatAgent } from "./chatAgent";

const LINQ_API_BASE = "https://api.linqapp.com/api/partner/v2";

// Helper to call Linq API
async function linqFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${LINQ_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-LINQ-INTEGRATION-TOKEN": process.env.LINQ_INTEGRATION_TOKEN!,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return response;
}

// Trigger context type for different agent triggers
type TriggerContext =
  | { type: "user_message"; event: string }
  | {
      type: "scheduled_reminder";
      reminders: Array<{
        taskId: string;
        taskTitle: string;
        taskType: string;
        reminderPurpose: string;
        dueAt?: number;
        eventAt?: number;
      }>;
    };

// The main agent action - runs the agent loop
export const runChatAgent = internalAction({
  args: {
    chatId: v.string(),
    triggerEvent: v.string(),
    triggerContext: v.optional(v.any()),
  },
  handler: async (ctx, { chatId, triggerEvent, triggerContext }) => {
    const parsedContext: TriggerContext = triggerContext ?? { type: "user_message", event: triggerEvent };
    console.log(`[Agent] Starting for chat ${chatId}, triggered by: ${parsedContext.type}`);

    // Send read receipt now that we're starting (after the 2s delay)
    try {
      await linqFetch(`/chats/${chatId}/mark_as_read`, { method: "PUT" });
      console.log(`[Agent] Sent initial read receipt for ${chatId}`);
    } catch (e) {
      console.log(`[Agent] Initial read receipt failed (ok)`);
    }

    // Fetch memories and onboarding status for this chat
    const [memories, isOnboarded] = await Promise.all([
      ctx.runQuery(internal.memories.getMemoriesForChat, { chatId }),
      ctx.runQuery(internal.memories.getChatOnboardingStatus, { chatId }),
    ]);

    console.log(`[Agent] Chat ${chatId}: ${memories.length} memories, onboarded: ${isOnboarded}`);

    // Create an agent scoped to this specific chat with context
    const chatAgent = createChatAgent(chatId, { isOnboarded, memories, triggerContext: parsedContext });

    // Create a thread for this agent session
    const { threadId } = await chatAgent.createThread(ctx, {});

    // Mark agent as active
    await ctx.runMutation(internal.agentQueries.markAgentActive, { chatId, threadId });

    try {
      // Build the initial prompt based on trigger type
      let initialPrompt: string;
      if (parsedContext.type === "user_message") {
        initialPrompt = `new message just came in

${triggerEvent}

do your thing - check messages with getMessages(), vibe check the convo, respond naturally. use read receipts and typing indicators realistically. split up your response into multiple texts if it makes sense. react to their messages with tapbacks when appropriate.

start by calling getMessages() to see the conversation`;
      } else {
        // scheduled_reminder
        const reminderList = parsedContext.reminders
          .map((r) => `- ${r.taskTitle} (${r.taskType}): ${r.reminderPurpose}`)
          .join("\n");
        initialPrompt = `SCHEDULED REMINDERS are due - you need to proactively message the user about these:

${reminderList}

check the conversation first with getMessages() to get context, then message them about the reminders naturally. dont be robotic - be a friend reminding them about stuff.`;
      }

      // Run the agent with the initial prompt
      const result = await chatAgent.generateText(
        ctx,
        { threadId },
        { prompt: initialPrompt }
      );

      console.log(`[Agent] Finished for chat ${chatId}:`, result.text);

      if (result.text?.includes("TERMINATE")) {
        console.log(`[Agent] Terminating for chat ${chatId}`);
      }

      // Check for pending_trigger reminders before terminating
      const pendingReminders = await ctx.runQuery(
        internal.reminders.getPendingTriggerReminders,
        { chatId }
      );

      if (pendingReminders.length > 0) {
        console.log(`[Agent] Found ${pendingReminders.length} pending reminders for chat ${chatId}`);

        const reminderList = pendingReminders
          .map((r) => `- ${r.taskTitle} (${r.taskType}): ${r.reminderPurpose}`)
          .join("\n");

        // Re-run agent with reminder context
        await chatAgent.generateText(ctx, { threadId }, {
          prompt: `SCHEDULED REMINDERS just became due while you were chatting:

${reminderList}

Message the user about these reminders naturally.`,
        });

        // Mark as triggered
        await ctx.runMutation(internal.reminders.markRemindersTriggered, {
          reminderIds: pendingReminders.map((r) => r._id),
        });
      }
    } catch (error) {
      console.error(`[Agent] Error for chat ${chatId}:`, error);
    } finally {
      await ctx.runMutation(internal.agentQueries.markAgentInactive, { chatId });
    }
  },
});

// Spawn agent from database trigger (when new message is stored)
export const spawnAgentFromDb = internalAction({
  args: {
    chatId: v.string(),
    messageText: v.string(),
    fromPhone: v.string(),
  },
  handler: async (ctx, { chatId, messageText, fromPhone }) => {
    const isActive = await ctx.runQuery(internal.agentQueries.isAgentActiveInternal, { chatId });

    if (isActive) {
      console.log(`[DB Trigger] Agent already active for chat ${chatId}, skipping`);
      return { spawned: false, reason: "agent_already_active" };
    }

    console.log(`[DB Trigger] New message in DB, spawning agent for chat ${chatId} with 2s delay`);

    // Delay before starting agent so the read receipt isn't instant
    const delayMs = 2000;

    await ctx.scheduler.runAfter(delayMs, internal.agents.runChatAgent, {
      chatId,
      triggerEvent: `message.received: ${JSON.stringify({ text: messageText, from_phone: fromPhone })}`,
    });

    return { spawned: true, delayMs };
  },
});

// HTTP-callable action to spawn an agent (legacy - called from Vercel webhook)
export const spawnAgentIfNeeded = action({
  args: {
    chatId: v.string(),
    eventType: v.string(),
    eventData: v.string(),
  },
  handler: async (ctx, { chatId, eventType, eventData }) => {
    const isActive = await ctx.runQuery(internal.agentQueries.isAgentActiveInternal, { chatId });

    if (isActive) {
      console.log(`[Spawn] Agent already active for chat ${chatId}, skipping`);
      return { spawned: false, reason: "agent_already_active" };
    }

    console.log(`[Spawn] Starting new agent for chat ${chatId} with 2s delay`);

    const delayMs = 2000;

    await ctx.scheduler.runAfter(delayMs, internal.agents.runChatAgent, {
      chatId,
      triggerEvent: `${eventType}: ${eventData}`,
    });

    return { spawned: true, delayMs };
  },
});

// Spawn agent for scheduled reminders
export const spawnAgentForReminders = internalAction({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const isActive = await ctx.runQuery(internal.agentQueries.isAgentActiveInternal, { chatId });

    if (isActive) {
      console.log(`[Reminder] Agent already active for chat ${chatId}, reminders marked as pending_trigger`);
      return { spawned: false, reason: "agent_already_active" };
    }

    // Get all pending_trigger reminders for this chat
    const pendingReminders = await ctx.runQuery(
      internal.reminders.getPendingTriggerReminders,
      { chatId }
    );

    if (pendingReminders.length === 0) {
      console.log(`[Reminder] No pending reminders for chat ${chatId}`);
      return { spawned: false, reason: "no_pending_reminders" };
    }

    console.log(`[Reminder] Spawning agent for ${pendingReminders.length} reminders in chat ${chatId}`);

    // Build trigger context
    const triggerContext = {
      type: "scheduled_reminder" as const,
      reminders: pendingReminders.map((r) => ({
        taskId: r.taskId.toString(),
        taskTitle: r.taskTitle,
        taskType: r.taskType,
        reminderPurpose: r.reminderPurpose,
        dueAt: r.dueAt,
        eventAt: r.eventAt,
      })),
    };

    // Mark reminders as triggered
    await ctx.runMutation(internal.reminders.markRemindersTriggered, {
      reminderIds: pendingReminders.map((r) => r._id),
    });

    // Spawn the agent with reminder context (no delay for reminders)
    await ctx.scheduler.runAfter(0, internal.agents.runChatAgent, {
      chatId,
      triggerEvent: "scheduled_reminder",
      triggerContext,
    });

    return { spawned: true };
  },
});
