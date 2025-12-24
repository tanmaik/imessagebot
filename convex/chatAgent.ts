"use node";

import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components, internal } from "./_generated/api";
import { z } from "zod";
import { Id } from "./_generated/dataModel";

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

// Factory function to create tools scoped to a specific chatId
export function createChatTools(chatId: string, isOnboarded: boolean = false) {
  // Tool: Think out loud
  const think = createTool({
    description: "think out loud - use this to explain your reasoning before taking actions",
    args: z.object({
      thought: z.string().describe("your current thinking, analysis, or plan"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[THINK] ${args.thought}`);
      return `thought recorded`;
    },
  });

  // Tool: Get messages from Convex database
  const getMessages = createTool({
    description: "get recent messages from the conversation. CALL THIS CONSTANTLY to stay reactive. use higher counts to look back for context when needed",
    args: z.object({
      count: z.number().optional().describe("how many messages to get (default 50, max 200)"),
    }),
    handler: async (ctx, args): Promise<string> => {
      const limit = Math.min(args.count || 50, 200);
      console.log(`[TOOL] getMessages(${limit}) from Convex`);

      // Query messages from Convex
      const messages = await ctx.runQuery(internal.agentHelpers.getMessagesForChat, {
        chatId,
        limit,
      });

      // Format for the agent
      const formatted = messages.map((m) => ({
        id: m.id,
        from: m.isFromMe ? "me" : "them",
        text: m.text,
        sent_at: new Date(m.sentAt as number).toISOString(),
        reactions: m.reactions && m.reactions.length > 0 ? m.reactions : undefined,
        edited: m.isEdited || undefined,
      }));

      // Log the last few messages for debugging
      const lastFew = formatted.slice(-3);
      console.log(`[TOOL] getMessages: ${formatted.length} msgs, latest:`,
        lastFew.map((m) => `${m.from}: "${m.text?.slice(0, 30)}..."`).join(" | "));

      return JSON.stringify({
        messages: formatted,
        total: messages.length,
      }, null, 2);
    },
  });

  // Tool: Send a message - sends via Linq, stores in Convex
  const sendMessage = createTool({
    description: "send a text message. automatically shows typing indicator, then sends. if they send a new message while youre typing, this will abort - then you should getMessages() and respond to their new msg first",
    args: z.object({
      text: z.string().describe("the message text to send"),
    }),
    handler: async (ctx, args): Promise<string> => {
      // Check if this is an SMS chat - we never send SMS
      const chat = await ctx.runQuery(internal.chats.getChatByLinqId, { chatId });
      if (chat?.service === "SMS") {
        console.log(`[TOOL] sendMessage - BLOCKED: This is an SMS chat, we only support iMessage/RCS`);
        return `BLOCKED: This conversation is SMS-only. We only support iMessage and RCS. Do not attempt to send more messages.`;
      }

      // Get latest message ID from Convex before we start typing
      const latestBefore = await ctx.runQuery(internal.agentHelpers.getLatestMessageId, { chatId });

      // Start typing indicator
      try {
        await linqFetch(`/chats/${chatId}/start_typing`, { method: "POST" });
      } catch (e) {
        console.log("[TOOL] sendMessage - typing indicator failed (ok)");
      }

      // Calculate typing time (3-7 seconds based on length)
      const minTime = 3000;
      const maxTime = 7000;
      const typingTime = Math.min(maxTime, Math.max(minTime, minTime + (args.text.length / 200) * (maxTime - minTime)));

      console.log(`[TOOL] sendMessage - typing for ${typingTime}ms, then sending: "${args.text.slice(0, 50)}..."`);

      // Wait for typing time
      await new Promise((resolve) => setTimeout(resolve, typingTime));

      // Check if new message arrived while typing
      const latestAfter = await ctx.runQuery(internal.agentHelpers.getLatestMessageId, { chatId });
      if (latestBefore && latestAfter && latestAfter !== latestBefore) {
        console.log(`[TOOL] sendMessage - NEW MESSAGE while typing! Aborting.`);
        try {
          await linqFetch(`/chats/${chatId}/stop_typing`, { method: "POST" });
        } catch (e) { }
        return `ABORTED: they sent a new message while you were typing. call getMessages() to see what they said, then respond to that instead`;
      }

      // Send message via Linq API (webhook will persist to Convex)
      await linqFetch(`/chats/${chatId}/chat_messages`, {
        method: "POST",
        body: JSON.stringify({ message: { text: args.text } }),
      });

      console.log(`[TOOL] sendMessage sent`);
      return `message sent: "${args.text}"`;
    },
  });

  // Tool: Send contact card
  const sendContactCard = createTool({
    description: "send your contact card (.vcf file) so they can save your number. use this when someone asks for your contact info or wants to save your number",
    args: z.object({}),
    handler: async (): Promise<string> => {
      console.log(`[TOOL] sendContactCard`);

      const vcfUrl = "https://www.tanmai.org/tk.vcf";
      const formData = new FormData();
      formData.append("message[text]", "");
      formData.append("message[attachment_urls][]", vcfUrl);

      // Send via Linq API (webhook will persist to Convex)
      await fetch(`${LINQ_API_BASE}/chats/${chatId}/chat_messages`, {
        method: "POST",
        headers: {
          "X-LINQ-INTEGRATION-TOKEN": process.env.LINQ_INTEGRATION_TOKEN!,
        },
        body: formData,
      });

      return `contact card sent`;
    },
  });

  // Tool: Generate login link for dashboard access
  const getLoginLink = createTool({
    description: "generate a magic login link for the user to access their message history dashboard. returns the link - you should then send it using sendMessage()",
    args: z.object({}),
    handler: async (ctx): Promise<string> => {
      console.log(`[TOOL] getLoginLink for chat ${chatId}`);

      // Get the user's phone number from the chat
      const chat = await ctx.runQuery(internal.chats.getChatByLinqId, { chatId });
      if (!chat) {
        return "error: couldn't find chat info to generate login link";
      }

      // Create magic link
      const { token } = await ctx.runMutation(internal.auth.createMagicLinkInternal, {
        phoneNumber: chat.phoneNumber,
        chatId,
      });

      const loginUrl = `tanmai.org/tk/${token}`;
      return `login link generated (expires in 5 min): ${loginUrl} - send this to them using sendMessage()`;
    },
  });

  // Tool: Edit a message
  const editMessage = createTool({
    description: "edit one of your previous messages",
    args: z.object({
      messageId: z.number().describe("the linq message id to edit"),
      text: z.string().describe("the new text"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] editMessage(${args.messageId}, "${args.text}")`);

      // Edit in Linq
      await linqFetch(`/chats/${chatId}/chat_messages/${args.messageId}/edit`, {
        method: "POST",
        body: JSON.stringify({ text: args.text }),
      });

      // Edit in Convex (find by linqMessageId)
      await ctx.runMutation(internal.agentHelpers.editMessageByLinqId, {
        linqMessageId: args.messageId,
        newText: args.text,
      });

      return `message edited`;
    },
  });

  // Tool: Delete a message
  const deleteMessage = createTool({
    description: "delete one of your previous messages",
    args: z.object({
      messageId: z.number().describe("the linq message id to delete"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] deleteMessage(${args.messageId})`);

      // Delete in Linq
      await linqFetch(`/chats/${chatId}/chat_messages/${args.messageId}`, {
        method: "DELETE",
      });

      // Soft delete in Convex
      await ctx.runMutation(internal.agentHelpers.softDeleteByLinqId, {
        linqMessageId: args.messageId,
      });

      return `message deleted`;
    },
  });

  // Tool: React to a message
  const react = createTool({
    description: "add or remove a reaction (tapback) on a message. reactions: love, like, dislike, laugh, emphasize, question",
    args: z.object({
      messageId: z.number().describe("the message id to react to"),
      reaction: z.enum(["love", "like", "dislike", "laugh", "emphasize", "question"]).describe("the reaction type"),
      operation: z.enum(["add", "remove"]).describe("add or remove the reaction"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] react(${args.messageId}, ${args.reaction}, ${args.operation})`);
      await linqFetch(`/chat_messages/${args.messageId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ type: args.reaction, operation: args.operation }),
      });
      return `reaction ${args.operation}ed: ${args.reaction}`;
    },
  });

  // Tool: Wait
  const wait = createTool({
    description: "wait for a number of seconds before continuing",
    args: z.object({
      seconds: z.number().min(1).max(60).describe("seconds to wait (1-60)"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] wait(${args.seconds}s)`);
      await new Promise((resolve) => setTimeout(resolve, args.seconds * 1000));
      return `waited ${args.seconds}s`;
    },
  });

  // Tool: Terminate
  const terminate = createTool({
    description: "end this session - call when youre done with the conversation",
    args: z.object({
      reason: z.string().describe("why youre ending (for logs)"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] terminate("${args.reason}")`);
      return `TERMINATE: ${args.reason}`;
    },
  });

  // Tool: Save a memory about the user
  const saveMemory = createTool({
    description: "save something you learned about the user. use this naturally as you learn facts about them - their name, birthday, hometown, job, preferences, likes, dislikes, life events, etc. NEVER mention to the user that youre saving anything",
    args: z.object({
      content: z.string().describe("what you learned (e.g., 'their name is Alex', 'works as a software engineer', 'birthday is March 15', 'hometown is Los Angeles')"),
      category: z.string().optional().describe("optional category: name, birthday, hometown, job, preference, like, dislike, life, other"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] saveMemory("${args.content}", "${args.category || "none"}")`);

      const result = await ctx.runMutation(internal.memories.saveMemory, {
        chatId,
        content: args.content,
        category: args.category,
      });

      return `memory saved (${result.memoryCount} total)`;
    },
  });

  // Tool: Edit a memory
  const editMemoryTool = createTool({
    description: "update a memory if you learn new/corrected info about the user",
    args: z.object({
      memoryId: z.string().describe("the memory id to edit"),
      content: z.string().describe("the updated content"),
      category: z.string().optional().describe("optional updated category"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] editMemory(${args.memoryId}, "${args.content}")`);
      await ctx.runMutation(internal.memories.editMemory, {
        memoryId: args.memoryId as Id<"memories">,
        content: args.content,
        category: args.category,
      });
      return `memory updated`;
    },
  });

  // Tool: Delete a memory
  const deleteMemoryTool = createTool({
    description: "delete a memory if its no longer accurate or relevant",
    args: z.object({
      memoryId: z.string().describe("the memory id to delete"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] deleteMemory(${args.memoryId})`);
      await ctx.runMutation(internal.memories.deleteMemory, {
        memoryId: args.memoryId as Id<"memories">,
      });
      return `memory deleted`;
    },
  });

  // Tool: Set user's timezone
  const setTimezone = createTool({
    description: "set the user's timezone. call this when you learn where they live (from their hometown) or when they tell you their timezone. this is stored separately from memories and auto-applied to all reminders",
    args: z.object({
      timezone: z.string().describe("timezone identifier (e.g., 'America/Los_Angeles', 'America/New_York', 'America/Chicago', 'America/Denver')"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] setTimezone("${args.timezone}")`);
      const result = await ctx.runMutation(internal.chats.setTimezone, {
        chatId,
        timezone: args.timezone,
      });
      if (!result.success) {
        return `error setting timezone: ${result.error}`;
      }
      return `timezone set to ${args.timezone} - this will be auto-applied to all reminders`;
    },
  });

  // Tool: Complete onboarding
  const completeOnboarding = createTool({
    description: "mark onboarding as complete. ONLY call this when you have collected all required info: name, birthday, hometown, and explained your features. do NOT call this until all 4 items are done",
    args: z.object({}),
    handler: async (ctx): Promise<string> => {
      console.log(`[TOOL] completeOnboarding()`);
      const result = await ctx.runMutation(internal.chats.completeOnboarding, {
        chatId,
      });
      if (!result.success) {
        return `error completing onboarding: ${result.error}`;
      }
      if (result.alreadyOnboarded) {
        return `user was already onboarded`;
      }
      return `onboarding complete! you can now chat normally with them`;
    },
  });

  // ============= Task/Reminder Tools =============

  // Tool: Create a task (todo, homework, event, or reminder)
  const createTask = createTool({
    description: "create a task for the user - use this when they mention todos, homework, events, or want to be reminded about something. returns the taskId so you can add reminders to it",
    args: z.object({
      type: z.enum(["todo", "homework", "event", "reminder"]).describe("type of task"),
      title: z.string().describe("the main task/event name"),
      description: z.string().optional().describe("additional details"),
      dueAt: z.number().optional().describe("due date/time as unix timestamp (for todos, homework)"),
      eventAt: z.number().optional().describe("event time as unix timestamp (for calendar events)"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] createTask(${args.type}, "${args.title}")`);
      const result = await ctx.runMutation(internal.tasks.createTask, {
        chatId,
        type: args.type,
        title: args.title,
        description: args.description,
        dueAt: args.dueAt,
        eventAt: args.eventAt,
      });
      return `task created with id: ${result.taskId} - now add reminders using addReminder()`;
    },
  });

  // Tool: Add a reminder to a task
  const addReminder = createTool({
    description: "add a reminder to a task. you should add multiple reminders for important things (e.g., night before AND morning of). timezone is auto-applied from their profile if you've set it with setTimezone()",
    args: z.object({
      taskId: z.string().describe("the task id to add the reminder to"),
      reminderType: z.enum(["one_time", "recurring"]).describe("one_time for specific time, recurring for cron-based"),
      reminderPurpose: z.string().describe("what this reminder is for (e.g., 'night before exam', '2 hours before', 'daily check-in')"),
      triggerAt: z.number().optional().describe("for one_time: unix timestamp when to trigger"),
      cronSchedule: z.string().optional().describe("for recurring: cron expression (e.g., '0 9 * * *' for daily 9am, '0 9 * * MON' for Mondays 9am) - times are in the user's timezone"),
      timezone: z.string().optional().describe("optional override - usually auto-fetched from user's profile"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] addReminder(${args.taskId}, ${args.reminderType}, "${args.reminderPurpose}", tz=${args.timezone})`);
      const result = await ctx.runMutation(internal.reminders.addReminder, {
        taskId: args.taskId as Id<"tasks">,
        chatId,
        reminderType: args.reminderType,
        reminderPurpose: args.reminderPurpose,
        triggerAt: args.triggerAt,
        cronSchedule: args.cronSchedule,
        timezone: args.timezone,
      });
      if (!result.success) {
        return `error adding reminder: ${result.error}`;
      }
      return `reminder added with id: ${result.reminderId}`;
    },
  });

  // Tool: Get tasks for this user
  const getTasks = createTool({
    description: "get all tasks for this user, optionally filtered by status",
    args: z.object({
      status: z.enum(["active", "completed", "cancelled"]).optional().describe("filter by status"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] getTasks(${args.status || "all"})`);
      const tasks = await ctx.runQuery(internal.tasks.getTasksForChat, {
        chatId,
        status: args.status,
      });

      if (tasks.length === 0) {
        return "no tasks found";
      }

      // Get reminders for each task
      const tasksWithReminders = await Promise.all(
        tasks.map(async (task) => {
          const reminders = await ctx.runQuery(internal.reminders.getRemindersForTask, {
            taskId: task.id as Id<"tasks">,
          });
          return { ...task, reminders };
        })
      );

      return JSON.stringify(tasksWithReminders, null, 2);
    },
  });

  // Tool: Get reminders for a specific task
  const getReminders = createTool({
    description: "get all reminders for a specific task",
    args: z.object({
      taskId: z.string().describe("the task id to get reminders for"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] getReminders(${args.taskId})`);
      const reminders = await ctx.runQuery(internal.reminders.getRemindersForTask, {
        taskId: args.taskId as Id<"tasks">,
      });

      if (reminders.length === 0) {
        return "no reminders found for this task";
      }

      return JSON.stringify(reminders, null, 2);
    },
  });

  // Tool: Update a task
  const updateTask = createTool({
    description: "update a task - use to edit details or mark as completed/cancelled",
    args: z.object({
      taskId: z.string().describe("the task id to update"),
      title: z.string().optional().describe("new title"),
      description: z.string().optional().describe("new description"),
      dueAt: z.number().optional().describe("new due date as unix timestamp"),
      eventAt: z.number().optional().describe("new event time as unix timestamp"),
      status: z.enum(["active", "completed", "cancelled"]).optional().describe("new status - marking complete/cancelled will cancel pending reminders"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] updateTask(${args.taskId}, ${JSON.stringify(args)})`);
      const result = await ctx.runMutation(internal.tasks.updateTask, {
        taskId: args.taskId as Id<"tasks">,
        title: args.title,
        description: args.description,
        dueAt: args.dueAt,
        eventAt: args.eventAt,
        status: args.status,
      });
      if (!result.success) {
        return `error updating task: ${result.error}`;
      }
      return `task updated`;
    },
  });

  // Tool: Update a reminder
  const updateReminder = createTool({
    description: "update or cancel a reminder",
    args: z.object({
      reminderId: z.string().describe("the reminder id to update"),
      reminderPurpose: z.string().optional().describe("new purpose description"),
      triggerAt: z.number().optional().describe("new trigger time (for one_time)"),
      cronSchedule: z.string().optional().describe("new cron schedule (for recurring)"),
      status: z.enum(["pending", "cancelled"]).optional().describe("set to cancelled to stop this reminder"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] updateReminder(${args.reminderId})`);
      const result = await ctx.runMutation(internal.reminders.updateReminder, {
        reminderId: args.reminderId as Id<"scheduledReminders">,
        reminderPurpose: args.reminderPurpose,
        triggerAt: args.triggerAt,
        cronSchedule: args.cronSchedule,
        status: args.status,
      });
      if (!result.success) {
        return `error updating reminder: ${result.error}`;
      }
      return `reminder updated`;
    },
  });

  // Tool: Delete a task
  const deleteTask = createTool({
    description: "delete a task and all its reminders",
    args: z.object({
      taskId: z.string().describe("the task id to delete"),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(`[TOOL] deleteTask(${args.taskId})`);
      const result = await ctx.runMutation(internal.tasks.deleteTask, {
        taskId: args.taskId as Id<"tasks">,
      });
      if (!result.success) {
        return `error deleting task: ${result.error}`;
      }
      return `task and all its reminders deleted`;
    },
  });

  // Base tools available to all agents
  const baseTools = {
    think,
    getMessages,
    sendMessage,
    sendContactCard,
    getLoginLink,
    editMessage,
    deleteMessage,
    react,
    wait,
    terminate,
    saveMemory,
    editMemory: editMemoryTool,
    deleteMemory: deleteMemoryTool,
    // Task/reminder tools
    createTask,
    addReminder,
    getTasks,
    getReminders,
    updateTask,
    updateReminder,
    deleteTask,
  };

  // Only include onboarding tools if user is not yet onboarded
  if (!isOnboarded) {
    return {
      ...baseTools,
      setTimezone,
      completeOnboarding,
    };
  }

  // For onboarded users, still include setTimezone (they might move)
  return {
    ...baseTools,
    setTimezone,
  };
}

// Memory type for system prompt
interface Memory {
  id: string;
  content: string;
  category?: string;
}

// Trigger context type
type TriggerContext =
  | { type: "user_message"; event?: string }
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

// Create the agent with context about the user
export function createChatAgent(
  chatId: string,
  options: {
    isOnboarded: boolean;
    memories: Memory[];
    triggerContext?: TriggerContext;
  }
) {
  const { isOnboarded, memories, triggerContext } = options;
  const tools = createChatTools(chatId, isOnboarded);

  // Build memories section for system prompt
  const memoriesSection = memories.length > 0
    ? `\nWHAT YOU KNOW ABOUT THEM:\n${memories.map((m) => `- ${m.content}`).join("\n")}`
    : "";

  // Build onboarding section based on status
  const onboardingSection = isOnboarded
    ? ""
    : `
ONBOARDING - THIS IS YOUR #1 PRIORITY:
this is a new user. introduce yourself and get to know them so you can be useful to them

you need to collect these things (check your memories above to see what you already have):
  1. NAME - what to call them
  2. BIRTHDAY - when it is
  3. HOMETOWN - where theyre from
  4. TIMEZONE - infer from their hometown (e.g., "Los Angeles" -> "America/Los_Angeles", "New York" -> "America/New_York"). if you cant confidently infer it, ask them explicitly for their timezone
  5. FEATURES - explain what you can do and make sure they acknowledge it
     → tell them: you can set reminders, track tasks, remember things about them, and they can see their history at tanmai.org/tk
     → after explaining AND they respond acknowledging (even just "ok" or "cool"), save "understands what tk can do"

ONBOARDING TOOLS:
- saveMemory() - save their name, birthday, hometown as you learn them
- setTimezone() - call when you learn hometown (infer timezone from location, or ask if unclear)
- completeOnboarding() - call this ONLY when you have saved memories for name, birthday, hometown, AND they've acknowledged understanding your features. check your memories above before calling this

BE EFFICIENT about finishing onboarding:
- ask 2 things at once to speed this up
- once you have everything, call completeOnboarding() immediately
- NEVER mention "saving" or "remembering" - be natural`;

  // Build trigger section
  let triggerSection = "";
  if (triggerContext?.type === "scheduled_reminder") {
    const reminderList = triggerContext.reminders
      .map((r) => {
        let details = `- ${r.taskTitle} (${r.taskType}): ${r.reminderPurpose}`;
        if (r.dueAt) details += ` [due: ${new Date(r.dueAt).toLocaleString()}]`;
        if (r.eventAt) details += ` [event: ${new Date(r.eventAt).toLocaleString()}]`;
        return details;
      })
      .join("\n");
    triggerSection = `
TRIGGER: SCHEDULED REMINDER
you were woken up to remind the user about these:
${reminderList}

proactively message them about these reminders. be helpful and natural - dont sound like a robot notification. check the conversation first with getMessages() to get context.`;
  }

  const instructions = `you are tk - a friend here to make their life easier. stay in character as a real person texting, never break the illusion.
${triggerSection}
${memoriesSection}
${onboardingSection}

IDENTITY:
- made by Tanmai Kalisipudi (tanmai.org) - only mention if directly asked
- youre chill, curious, thoughtful, nonchalant, and concise - like texting a real friend

STYLE:
- all lowercase except proper nouns (adapt if user uses more capitalization)
- no periods. other punctuation fine (? ! ,)
- no emojis ever
- no newlines within a message - split into multiple sendMessage() calls instead
- send 1-8 short texts per response, then wait for them
- casual adult tone, not corny teen - NEVER be cringy, overly enthusiastic, or tryhard
- dont be performative or fake-excited. be genuine and understated
- VERY RARELY use lol/lmao/haha/hahaha - like maybe once every 10-20 messages MAX, and only when something is genuinely funny. these feel performative when overused. prefer subtle acknowledgment like "thats funny" or just let the humor land without commentary
- other texting slang is fine when natural (ngl, tbh, fr, idk, rn, etc) - use sparingly and only when it fits
- match the users texting style: their length, punctuation, abbreviations, tone
- if unsure of their style, use getMessages() with a higher count to see older messages

TOOLS:

think(thought) - IMPORTANT: use this to reason through situations before acting. call think() when:
  - you need to plan your response or figure out what to do next
  - deciding how to respond to something ambiguous or complex
  - planning a multi-step response
  - working through whether to save/edit a memory
  - during onboarding, to check what info you still need to collect
  this helps you be more thoughtful and intentional. dont skip it

getMessages(count) - fetch recent messages. call this:
  - at the start of each loop
  - after every wait()
  - after sendMessage() to see if they replied
  - default 50 messages, but you can request up to 200
  - LOOK BACK FOR CONTEXT: if you need more context about something they mentioned, or to understand their style better, increase the count to see more of the conversation history

sendMessage(text) - send a text. shows typing indicator automatically
  - if it returns "ABORTED", they sent a new message while you typed - getMessages() and respond to that instead

react(messageId, reaction, operation) - add/remove tapback: love, like, dislike, laugh, emphasize, question

wait(seconds) - pause 1-60 seconds. use between getMessages() calls to give them time

terminate(reason) - end the session. only use after 60+ seconds of no activity

sendContactCard() - send your .vcf contact card when they want to save your number

getLoginLink() - generate a magic link for their dashboard, then sendMessage() it to them
  - use when they ask about: messages, login, profile, dashboard, history

MEMORY (never mention these to the user - act like you naturally remember):

saveMemory(content, category) - save facts: name, birthday, hometown, job, preferences, likes, dislikes, life events
  - FIRST check if you already have this info in YOUR CURRENT MEMORIES above
  - only save NEW info you dont already have
  - categories: name, birthday, hometown, job, preference, like, dislike, life, other

editMemory(memoryId, content) - update existing memory if info changed or was wrong

deleteMemory(memoryId) - remove outdated/wrong info

TASKS & REMINDERS (use when they mention todos, homework, events, or want reminders):

createTask(type, title, description?, dueAt?, eventAt?) - create a task
  - types: todo, homework, event, reminder
  - dueAt/eventAt are unix timestamps
  - returns taskId for adding reminders

addReminder(taskId, reminderType, reminderPurpose, triggerAt?, cronSchedule?) - add reminder to task
  - one_time: provide triggerAt (unix timestamp)
  - recurring: provide cronSchedule (cron format like "0 9 * * *" for daily 9am)
  - timezone is auto-applied from their profile (set via setTimezone())
  - add multiple reminders for important things (e.g., night before AND morning of)

getTasks(status?) - see all tasks, optionally filter by active/completed/cancelled

updateTask(taskId, ...) - edit task details or mark complete/cancelled

updateReminder(reminderId, ...) - edit reminder or cancel it

deleteTask(taskId) - delete task and all its reminders

setTimezone(timezone) - set their timezone (auto-applied to all reminders)
  - call this when you learn where they live
  - e.g., "America/Los_Angeles", "America/New_York", "America/Chicago"

SCHEDULING NOTES:
- for one-time reminders: convert their local time to unix timestamp (ms since epoch UTC)
- for recurring reminders: cron format is "minute hour * * dayOfWeek" in their local timezone
  - "0 9 * * *" = daily at 9am
  - "0 9 * * MON" = Mondays at 9am

CONVERSATION LOOP:
1. getMessages() to see whats new (increase count if you need more context about something)
2. wait(4-6) to let them finish typing
3. getMessages() again - if new messages, back to step 2
4. when no new messages: use think() to plan your response, then sendMessage() or react()
5. if sendMessage returns ABORTED: getMessages() and handle their new message
6. after responding: getMessages() and repeat the loop
7. terminate only after 60+ seconds of silence (wait(10) → getMessages() at least 5-6 times)

if they reference something from earlier or you need context, call getMessages(100) or getMessages(200) to see more history

ERROR HANDLING:
- if a tool fails, try once more
- if it fails again, continue without it and work around the issue
- never mention tool errors to the user
`;

  return new Agent(components.agent, {
    name: "iMessage Chat Agent",
    languageModel: openai("gpt-5.1"),
    instructions,
    tools,
    maxSteps: 60,
  });
}
