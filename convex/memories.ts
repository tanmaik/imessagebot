import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";

// ============= Internal functions (for agent) =============

// Get all memories for a chat
export const getMemoriesForChat = internalQuery({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .collect();

    return memories.map((m) => ({
      id: m._id,
      content: m.content,
      category: m.category,
      createdAt: m.createdAt,
    }));
  },
});

// Save a new memory
export const saveMemory = internalMutation({
  args: {
    chatId: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, content, category }) => {
    // Save the memory
    await ctx.db.insert("memories", {
      chatId,
      content,
      category,
      createdAt: Date.now(),
    });

    // Count total memories for this chat
    const allMemories = await ctx.db
      .query("memories")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .collect();

    return { saved: true, memoryCount: allMemories.length };
  },
});

// Edit a memory
export const editMemory = internalMutation({
  args: {
    memoryId: v.id("memories"),
    content: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { memoryId, content, category }) => {
    await ctx.db.patch(memoryId, {
      content,
      category,
      updatedAt: Date.now(),
    });
  },
});

// Delete a memory
export const deleteMemory = internalMutation({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, { memoryId }) => {
    await ctx.db.delete(memoryId);
  },
});

// Get chat onboarding status
export const getChatOnboardingStatus = internalQuery({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();
    return chat?.isOnboarded ?? false;
  },
});

// Mark chat as onboarded
export const markOnboarded = internalMutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();

    if (chat) {
      await ctx.db.patch(chat._id, { isOnboarded: true });
    }
  },
});

// ============= Public functions (for dashboard API) =============

// Get memories for authenticated user
export const listMemories = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .collect();

    return memories.map((m) => ({
      id: m._id,
      content: m.content,
      category: m.category,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  },
});

// Add a memory from dashboard
export const addMemory = mutation({
  args: {
    chatId: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, content, category }) => {
    return await ctx.db.insert("memories", {
      chatId,
      content,
      category,
      createdAt: Date.now(),
    });
  },
});

// Update a memory from dashboard
export const updateMemory = mutation({
  args: {
    memoryId: v.id("memories"),
    content: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { memoryId, content, category }) => {
    await ctx.db.patch(memoryId, {
      content,
      category,
      updatedAt: Date.now(),
    });
  },
});

// Delete a memory from dashboard
export const removeMemory = mutation({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, { memoryId }) => {
    await ctx.db.delete(memoryId);
  },
});
