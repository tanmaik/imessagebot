import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Generate a secure random token
function generateToken(length: number = 32): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Create a magic link for passwordless login
export const createMagicLink = mutation({
  args: {
    phoneNumber: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, { phoneNumber, chatId }) => {
    // Invalidate existing unused magic links for this phone
    const existingLinks = await ctx.db
      .query("magicLinks")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .filter((q) => q.eq(q.field("used"), false))
      .collect();

    for (const link of existingLinks) {
      await ctx.db.patch(link._id, { used: true });
    }

    // Generate new magic link with 5-minute expiry
    const token = generateToken(48);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await ctx.db.insert("magicLinks", {
      token,
      phoneNumber,
      chatId,
      expiresAt,
      used: false,
    });

    return { token };
  },
});

// Verify magic link and create session
export const verifyMagicLink = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    // Find the magic link
    const magicLink = await ctx.db
      .query("magicLinks")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!magicLink) {
      return { success: false, error: "Invalid link" };
    }

    if (magicLink.used) {
      return { success: false, error: "Link already used" };
    }

    if (magicLink.expiresAt < Date.now()) {
      return { success: false, error: "Link expired" };
    }

    // Mark link as used
    await ctx.db.patch(magicLink._id, { used: true });

    // Find or create user
    let user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", magicLink.phoneNumber))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        phoneNumber: magicLink.phoneNumber,
        chatId: magicLink.chatId,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    } else {
      await ctx.db.patch(user._id, {
        lastLoginAt: Date.now(),
        chatId: magicLink.chatId, // Update chatId in case it changed
      });
    }

    // Create session
    const sessionToken = generateToken();
    await ctx.db.insert("sessions", {
      userId: user!._id,
      token: sessionToken,
      createdAt: Date.now(),
    });

    return {
      success: true,
      token: sessionToken,
      user: {
        id: user!._id,
        phoneNumber: user!.phoneNumber,
        chatId: user!.chatId,
      },
    };
  },
});

// Get current user from session token
export const getCurrentUser = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      phoneNumber: user.phoneNumber,
      chatId: user.chatId,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  },
});

// Logout - invalidate session
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Update user's chatId
export const updateUserChatId = mutation({
  args: {
    phoneNumber: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, { phoneNumber, chatId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { chatId });
    }
  },
});

// Get user by phone number
export const getUserByPhone = query({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx, { phoneNumber }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .first();
  },
});

// Get user by chatId
export const getUserByChatId = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, { chatId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();
  },
});

// Internal mutation to create magic link (called by agent)
export const createMagicLinkInternal = internalMutation({
  args: {
    phoneNumber: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, { phoneNumber, chatId }) => {
    // Invalidate existing unused magic links
    const existingLinks = await ctx.db
      .query("magicLinks")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .filter((q) => q.eq(q.field("used"), false))
      .collect();

    for (const link of existingLinks) {
      await ctx.db.patch(link._id, { used: true });
    }

    // Generate token
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 48; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }

    const expiresAt = Date.now() + 5 * 60 * 1000;

    await ctx.db.insert("magicLinks", {
      token,
      phoneNumber,
      chatId,
      expiresAt,
      used: false,
    });

    return { token };
  },
});
