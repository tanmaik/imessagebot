import { mutation } from "./_generated/server";

// Admin mutation to clear all messages
export const clearAllMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    return { deleted: messages.length };
  },
});

// Admin mutation to clear all chats
export const clearAllChats = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query("chats").collect();
    for (const chat of chats) {
      await ctx.db.delete(chat._id);
    }
    return { deleted: chats.length };
  },
});

// Admin mutation to clear all users
export const clearAllUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    return { deleted: users.length };
  },
});

// Admin mutation to clear all sessions
export const clearAllSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    return { deleted: sessions.length };
  },
});

// Admin mutation to clear all magic links
export const clearAllMagicLinks = mutation({
  args: {},
  handler: async (ctx) => {
    const links = await ctx.db.query("magicLinks").collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
    return { deleted: links.length };
  },
});

// Admin mutation to clear all active agents
export const clearAllActiveAgents = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("activeAgents").collect();
    for (const agent of agents) {
      await ctx.db.delete(agent._id);
    }
    return { deleted: agents.length };
  },
});

// Admin mutation to clear all memories
export const clearAllMemories = mutation({
  args: {},
  handler: async (ctx) => {
    const memories = await ctx.db.query("memories").collect();
    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }
    return { deleted: memories.length };
  },
});

// Admin mutation to reset onboarding for all chats
export const resetAllOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query("chats").collect();
    let updated = 0;
    for (const chat of chats) {
      if (chat.isOnboarded) {
        await ctx.db.patch(chat._id, { isOnboarded: false });
        updated++;
      }
    }
    return { updated };
  },
});

// Admin mutation to clear all tasks
export const clearAllTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    return { deleted: tasks.length };
  },
});

// Admin mutation to clear all scheduled reminders
export const clearAllScheduledReminders = mutation({
  args: {},
  handler: async (ctx) => {
    const reminders = await ctx.db.query("scheduledReminders").collect();
    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id);
    }
    return { deleted: reminders.length };
  },
});

// Admin mutation to reset EVERYTHING
export const resetEverything = mutation({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, number> = {};

    // Clear all tables
    const tables = [
      "messages",
      "chats",
      "users",
      "sessions",
      "magicLinks",
      "activeAgents",
      "memories",
      "tasks",
      "scheduledReminders",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      results[table] = docs.length;
    }

    return results;
  },
});

