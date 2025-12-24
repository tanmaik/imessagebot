import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// Internal query to get messages for agent
export const getMessagesForChat = internalQuery({
  args: {
    chatId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, { chatId, limit }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .order("desc")
      .take(limit);

    // Filter deleted and reverse for chronological order
    return messages
      .filter((m) => !m.isDeleted) // isDeleted might be undefined, which is falsy
      .reverse()
      .map((m) => ({
        id: m._id,
        linqMessageId: m.linqMessageId,
        text: m.text,
        sentAt: m.sentAt,
        sentFrom: m.sentFrom,
        isFromMe: m.isFromMe,
        isEdited: m.isEdited || false,
        reactions: m.reactions,
      }));
  },
});

// Internal query to get latest message ID for abort detection
export const getLatestMessageId = internalQuery({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .order("desc")
      .first();

    return message?._id ?? null;
  },
});

// Internal mutation to store a sent message
export const storeMessage = internalMutation({
  args: {
    chatId: v.string(),
    linqMessageId: v.optional(v.number()),
    text: v.string(),
    sentAt: v.number(),
    sentFrom: v.string(),
    isFromMe: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    if (args.linqMessageId) {
      const existing = await ctx.db
        .query("messages")
        .withIndex("by_linqId", (q) => q.eq("linqMessageId", args.linqMessageId))
        .first();
      if (existing) return existing._id;
    }

    return await ctx.db.insert("messages", {
      ...args,
      isEdited: false,
      isDeleted: false,
    });
  },
});

// Internal mutation to edit a message by Linq ID
export const editMessageByLinqId = internalMutation({
  args: {
    linqMessageId: v.number(),
    newText: v.string(),
  },
  handler: async (ctx, { linqMessageId, newText }) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_linqId", (q) => q.eq("linqMessageId", linqMessageId))
      .first();

    if (message) {
      const originalText = message.isEdited ? message.originalText : message.text;
      await ctx.db.patch(message._id, {
        text: newText,
        isEdited: true,
        originalText,
        editedAt: Date.now(),
      });
    }
  },
});

// Internal mutation to soft delete by Linq ID
export const softDeleteByLinqId = internalMutation({
  args: {
    linqMessageId: v.number(),
  },
  handler: async (ctx, { linqMessageId }) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_linqId", (q) => q.eq("linqMessageId", linqMessageId))
      .first();

    if (message) {
      await ctx.db.patch(message._id, {
        isDeleted: true,
        deletedAt: Date.now(),
      });
    }
  },
});

