import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

// Get or create a chat
export const getOrCreate = mutation({
  args: {
    chatId: v.string(),
    phoneNumber: v.string(),
    displayName: v.optional(v.string()),
    service: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, phoneNumber, displayName, service }) => {
    // Check if chat exists
    const existing = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();

    if (existing) {
      // Update display name and service if provided
      const updates: { displayName?: string; service?: string } = {};
      if (displayName && displayName !== existing.displayName) {
        updates.displayName = displayName;
      }
      if (service && service !== existing.service) {
        updates.service = service;
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
      }
      return existing._id;
    }

    // Create new chat
    return await ctx.db.insert("chats", {
      chatId,
      phoneNumber,
      displayName,
      service,
      messageCount: 0,
    });
  },
});

// Internal mutation for webhook
export const getOrCreateInternal = internalMutation({
  args: {
    chatId: v.string(),
    phoneNumber: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, phoneNumber, displayName }) => {
    const existing = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();

    if (existing) {
      if (displayName && displayName !== existing.displayName) {
        await ctx.db.patch(existing._id, { displayName });
      }
      return existing._id;
    }

    return await ctx.db.insert("chats", {
      chatId,
      phoneNumber,
      displayName,
      messageCount: 0,
    });
  },
});

// Get chat by ID
export const getByChatId = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();
  },
});

// Get chat by phone number
export const getByPhone = query({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx, { phoneNumber }) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .first();
  },
});

// List all chats (for admin view)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db
      .query("chats")
      .order("desc")
      .take(100);

    return chats.map((c) => ({
      id: c._id,
      chatId: c.chatId,
      phoneNumber: c.phoneNumber,
      displayName: c.displayName,
      lastMessageAt: c.lastMessageAt,
      lastMessageText: c.lastMessageText,
      messageCount: c.messageCount,
    }));
  },
});

// Internal query to get chat by Linq ID (for agent)
export const getChatByLinqId = internalQuery({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();
  },
});

// Update chat display name
export const updateDisplayName = mutation({
  args: {
    chatId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, { chatId, displayName }) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();

    if (!chat) {
      throw new Error("Chat not found");
    }

    await ctx.db.patch(chat._id, { displayName });
    return { success: true };
  },
});

// Set user's timezone (internal mutation for agent)
export const setTimezone = internalMutation({
  args: {
    chatId: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, { chatId, timezone }) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();

    if (!chat) {
      return { success: false, error: "Chat not found" };
    }

    await ctx.db.patch(chat._id, { timezone });
    return { success: true, timezone };
  },
});

// Get user's timezone (internal query for agent/reminders)
export const getTimezone = internalQuery({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();

    return chat?.timezone ?? null;
  },
});

// Complete onboarding (internal mutation for agent)
export const completeOnboarding = internalMutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();

    if (!chat) {
      return { success: false, error: "Chat not found" };
    }

    if (chat.isOnboarded) {
      return { success: true, alreadyOnboarded: true };
    }

    await ctx.db.patch(chat._id, { isOnboarded: true });
    return { success: true };
  },
});

