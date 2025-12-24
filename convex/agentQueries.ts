import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

// Check if an agent is already active for this chat
export const isAgentActive = query({
  args: { chatId: v.string() },
  handler: async (ctx, { chatId }) => {
    const existing = await ctx.db
      .query("activeAgents")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .first();
    return !!existing;
  },
});

// Internal version for use in actions
export const isAgentActiveInternal = internalQuery({
  args: { chatId: v.string() },
  handler: async (ctx, { chatId }) => {
    const existing = await ctx.db
      .query("activeAgents")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .first();
    return !!existing;
  },
});

// Mark an agent as active
export const markAgentActive = internalMutation({
  args: { chatId: v.string(), threadId: v.string() },
  handler: async (ctx, { chatId, threadId }) => {
    // Check if already exists
    const existing = await ctx.db
      .query("activeAgents")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("activeAgents", {
      chatId,
      threadId,
      startedAt: Date.now(),
    });
  },
});

// Remove agent when done
export const markAgentInactive = internalMutation({
  args: { chatId: v.string() },
  handler: async (ctx, { chatId }) => {
    const existing = await ctx.db
      .query("activeAgents")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

