import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Track active agents per chat
  activeAgents: defineTable({
    chatId: v.string(),
    threadId: v.string(),
    startedAt: v.number(),
  }).index("by_chat", ["chatId"]),

  // Chat metadata
  chats: defineTable({
    chatId: v.string(), // Linq chat ID
    phoneNumber: v.string(), // The other person's phone number
    displayName: v.optional(v.string()),
    service: v.optional(v.string()), // "iMessage", "SMS", "RCS" - we block SMS
    lastMessageAt: v.optional(v.number()),
    lastMessageText: v.optional(v.string()),
    messageCount: v.number(),
    isOnboarded: v.optional(v.boolean()), // Has user completed initial onboarding?
    timezone: v.optional(v.string()), // User's timezone (e.g., "America/Los_Angeles")
  })
    .index("by_chatId", ["chatId"])
    .index("by_phone", ["phoneNumber"]),

  // All messages (source of truth)
  messages: defineTable({
    chatId: v.string(),
    linqMessageId: v.optional(v.number()), // Linq's message ID
    text: v.string(),
    sentAt: v.union(v.number(), v.string()), // Unix timestamp or ISO string (legacy)
    sentFrom: v.string(), // Phone number that sent it
    isFromMe: v.boolean(), // true = TK sent it, false = user sent it
    service: v.optional(v.string()), // iMessage, SMS, RCS
    isRead: v.optional(v.boolean()),

    // Legacy fields (from old schema)
    userId: v.optional(v.any()), // Legacy - ignore

    // Edit tracking
    isEdited: v.optional(v.boolean()),
    originalText: v.optional(v.string()),
    editedAt: v.optional(v.number()),

    // Soft delete (for dashboard)
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),

    // Attachments
    attachments: v.optional(v.array(v.object({
      id: v.string(),
      url: v.string(),
      filename: v.optional(v.string()),
      mimeType: v.optional(v.string()),
    }))),

    // Reactions stored separately but also cached here
    reactions: v.optional(v.array(v.object({
      id: v.number(),
      reaction: v.string(),
      isFromMe: v.boolean(),
      fromPhone: v.string(),
    }))),
  })
    .index("by_chatId", ["chatId"])
    .index("by_linqId", ["linqMessageId"]),

  // Dashboard users
  users: defineTable({
    phoneNumber: v.string(),
    chatId: v.optional(v.string()), // Their chat with TK
    createdAt: v.number(),
    lastLoginAt: v.number(),
  })
    .index("by_phone", ["phoneNumber"])
    .index("by_chatId", ["chatId"]),

  // Magic links for passwordless login (5-minute expiry)
  magicLinks: defineTable({
    token: v.string(),
    phoneNumber: v.string(),
    chatId: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_phone", ["phoneNumber"]),

  // User sessions
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Memories - things the agent learns about users
  memories: defineTable({
    chatId: v.string(), // Links to the chat/user
    content: v.string(), // The memory content (e.g., "Their name is John")
    category: v.optional(v.string()), // Optional category (name, birthday, preference, etc.)
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_chatId", ["chatId"]),

  // Tasks - todos, homework, events, reminders
  tasks: defineTable({
    chatId: v.string(), // Links to user
    type: v.string(), // "todo" | "homework" | "event" | "reminder"
    title: v.string(), // Main task name
    description: v.optional(v.string()), // Additional details
    dueAt: v.optional(v.number()), // Due date/time (todos, homework)
    eventAt: v.optional(v.number()), // Event time (calendar events)
    status: v.string(), // "active" | "completed" | "cancelled"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_chatId", ["chatId"])
    .index("by_status", ["chatId", "status"]),

  // Scheduled reminders - attached to tasks
  scheduledReminders: defineTable({
    taskId: v.id("tasks"), // Parent task
    chatId: v.string(), // For quick lookup
    reminderType: v.string(), // "one_time" | "recurring"

    // For one-time reminders
    triggerAt: v.optional(v.number()), // Specific timestamp (already in UTC)
    scheduledFunctionId: v.optional(v.string()), // To cancel if needed

    // For recurring reminders
    cronSchedule: v.optional(v.string()), // e.g., "0 9 * * MON" (every Monday 9am in USER'S timezone)
    timezone: v.optional(v.string()), // User's timezone (e.g., "America/Los_Angeles", "PST")
    nextTriggerAt: v.optional(v.number()), // When recurring will fire next (in UTC)

    reminderPurpose: v.string(), // What to remind about (e.g., "1 hour before event")
    status: v.string(), // "pending" | "pending_trigger" | "triggered" | "cancelled"
    lastTriggeredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_chatId", ["chatId"])
    .index("by_nextTrigger", ["status", "nextTriggerAt"])
    .index("by_pending_trigger", ["chatId", "status"]),
});

