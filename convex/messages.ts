import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Store a new message from webhook - triggers agent if from user
export const store = mutation({
  args: {
    chatId: v.string(),
    linqMessageId: v.optional(v.number()),
    text: v.string(),
    sentAt: v.number(),
    sentFrom: v.string(),
    isFromMe: v.boolean(),
    service: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.object({
      id: v.string(),
      url: v.string(),
      filename: v.optional(v.string()),
      mimeType: v.optional(v.string()),
    }))),
    triggerAgent: v.optional(v.boolean()), // Set to false to skip agent trigger
  },
  handler: async (ctx, args) => {
    // Check if message already exists (by linqMessageId)
    if (args.linqMessageId) {
      const existing = await ctx.db
        .query("messages")
        .withIndex("by_linqId", (q) => q.eq("linqMessageId", args.linqMessageId))
        .first();

      if (existing) {
        // Update isRead if changed
        if (args.isRead !== undefined && args.isRead !== existing.isRead) {
          await ctx.db.patch(existing._id, { isRead: args.isRead });
        }
        return { messageId: existing._id, isNew: false };
      }
    }

    // Insert new message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      linqMessageId: args.linqMessageId,
      text: args.text,
      sentAt: args.sentAt,
      sentFrom: args.sentFrom,
      isFromMe: args.isFromMe,
      service: args.service,
      isRead: args.isRead,
      attachments: args.attachments,
      isEdited: false,
      isDeleted: false,
    });

    // Update chat metadata
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (chat) {
      await ctx.db.patch(chat._id, {
        lastMessageAt: args.sentAt,
        lastMessageText: args.text.slice(0, 100),
        messageCount: chat.messageCount + 1,
      });
    }

    // Trigger agent for new messages from users (not from TK)
    if (!args.isFromMe && args.triggerAgent !== false) {
      // Schedule agent spawn - this runs after the mutation commits
      await ctx.scheduler.runAfter(0, internal.agents.spawnAgentFromDb, {
        chatId: args.chatId,
        messageText: args.text,
        fromPhone: args.sentFrom,
      });
    }

    return { messageId, isNew: true };
  },
});

// Add a reaction to a message
export const addReaction = mutation({
  args: {
    linqMessageId: v.number(),
    reaction: v.object({
      id: v.number(),
      reaction: v.string(),
      isFromMe: v.boolean(),
      fromPhone: v.string(),
    }),
  },
  handler: async (ctx, { linqMessageId, reaction }) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_linqId", (q) => q.eq("linqMessageId", linqMessageId))
      .first();

    if (!message) {
      console.log(`Message ${linqMessageId} not found for reaction`);
      return;
    }

    const existingReactions = message.reactions || [];

    // Check if this reaction already exists
    const existingIndex = existingReactions.findIndex(r => r.id === reaction.id);

    if (existingIndex >= 0) {
      // Update existing reaction
      existingReactions[existingIndex] = reaction;
    } else {
      // Add new reaction
      existingReactions.push(reaction);
    }

    await ctx.db.patch(message._id, { reactions: existingReactions });
  },
});

// Internal mutation for storing messages (used by webhook)
export const storeInternal = internalMutation({
  args: {
    chatId: v.string(),
    linqMessageId: v.optional(v.number()),
    text: v.string(),
    sentAt: v.number(),
    sentFrom: v.string(),
    isFromMe: v.boolean(),
    attachments: v.optional(v.array(v.object({
      id: v.string(),
      url: v.string(),
      filename: v.optional(v.string()),
      mimeType: v.optional(v.string()),
    }))),
    reactions: v.optional(v.array(v.object({
      id: v.number(),
      reaction: v.string(),
      isFromMe: v.boolean(),
      fromPhone: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    // Check if message already exists (by linqMessageId)
    if (args.linqMessageId) {
      const existing = await ctx.db
        .query("messages")
        .withIndex("by_linqId", (q) => q.eq("linqMessageId", args.linqMessageId))
        .first();

      if (existing) {
        // Update reactions if changed
        await ctx.db.patch(existing._id, {
          reactions: args.reactions,
        });
        return existing._id;
      }
    }

    // Insert new message
    const messageId = await ctx.db.insert("messages", {
      ...args,
      isEdited: false,
      isDeleted: false,
    });

    // Update chat metadata
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (chat) {
      await ctx.db.patch(chat._id, {
        lastMessageAt: args.sentAt,
        lastMessageText: args.text.slice(0, 100),
        messageCount: chat.messageCount + 1,
      });
    }

    return messageId;
  },
});

// Edit a message
export const edit = mutation({
  args: {
    messageId: v.id("messages"),
    newText: v.string(),
  },
  handler: async (ctx, { messageId, newText }) => {
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Store original text if this is the first edit
    const originalText = message.isEdited ? message.originalText : message.text;

    await ctx.db.patch(messageId, {
      text: newText,
      isEdited: true,
      originalText,
      editedAt: Date.now(),
    });

    return { success: true };
  },
});

// Soft delete a message
export const softDelete = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.patch(messageId, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    return { success: true };
  },
});

// Restore a soft-deleted message
export const restore = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.patch(messageId, {
      isDeleted: false,
      deletedAt: undefined,
    });

    return { success: true };
  },
});

// Get messages for a chat (excludes deleted, returns chronological order)
export const getForChat = query({
  args: {
    chatId: v.string(),
    limit: v.optional(v.number()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, { chatId, limit = 50, includeDeleted = false }) => {
    let messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .order("desc")
      .take(limit);

    // Filter out deleted unless requested (isDeleted might be undefined)
    if (!includeDeleted) {
      messages = messages.filter((m) => !m.isDeleted);
    }

    // Reverse to get chronological order (oldest first)
    messages = messages.reverse();

    return messages.map((m) => ({
      id: m._id,
      linqMessageId: m.linqMessageId,
      text: m.text,
      sentAt: m.sentAt,
      sentFrom: m.sentFrom,
      isFromMe: m.isFromMe,
      isEdited: m.isEdited || false,
      isDeleted: m.isDeleted || false,
      attachments: m.attachments,
      reactions: m.reactions,
    }));
  },
});

// Get message count for a chat
export const getCount = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    return messages.length;
  },
});

// Get latest message ID for a chat (used by agent to check for new messages)
export const getLatestId = query({
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

// Update message reactions
export const updateReactions = mutation({
  args: {
    messageId: v.id("messages"),
    reactions: v.array(v.object({
      id: v.number(),
      reaction: v.string(),
      isFromMe: v.boolean(),
      fromPhone: v.string(),
    })),
  },
  handler: async (ctx, { messageId, reactions }) => {
    await ctx.db.patch(messageId, { reactions });
    return { success: true };
  },
});

