import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const LINQ_API_BASE = "https://api.linqapp.com/api/partner/v2";

async function linqFetch(endpoint: string, options: RequestInit = {}) {
  return fetch(`${LINQ_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-LINQ-INTEGRATION-TOKEN": process.env.LINQ_INTEGRATION_TOKEN!,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

// Verify auth and get user
async function getAuthUser(request: NextRequest, convex: ConvexHttpClient) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return null;

  return await convex.query(api.auth.getCurrentUser, { token });
}

// GET - Fetch messages
export async function GET(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const user = await getAuthUser(request, convex);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.chatId) {
      return NextResponse.json({ messages: [], total: 0 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const messages = await convex.query(api.messages.getForChat, {
      chatId: user.chatId,
      limit,
      includeDeleted,
    });

    return NextResponse.json({ messages, total: messages.length });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// PATCH - Edit a message
export async function PATCH(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const user = await getAuthUser(request, convex);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, text, syncToLinq, linqMessageId, chatId } = await request.json();

    if (!messageId || !text) {
      return NextResponse.json({ error: "messageId and text required" }, { status: 400 });
    }

    // Edit in Convex
    await convex.mutation(api.messages.edit, {
      messageId: messageId as Id<"messages">,
      newText: text,
    });

    // Optionally sync to Linq (only for messages you sent)
    if (syncToLinq && linqMessageId && chatId) {
      try {
        await linqFetch(`/chats/${chatId}/chat_messages/${linqMessageId}/edit`, {
          method: "POST",
          body: JSON.stringify({ text }),
        });
      } catch (e) {
        console.log("Failed to sync edit to Linq (ok)");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json({ error: "Failed to edit message" }, { status: 500 });
  }
}

// DELETE - Soft delete a message
export async function DELETE(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const user = await getAuthUser(request, convex);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");
    const syncToLinq = searchParams.get("syncToLinq") === "true";
    const linqMessageId = searchParams.get("linqMessageId");
    const chatId = searchParams.get("chatId");

    if (!messageId) {
      return NextResponse.json({ error: "messageId required" }, { status: 400 });
    }

    // Soft delete in Convex
    await convex.mutation(api.messages.softDelete, {
      messageId: messageId as Id<"messages">,
    });

    // Optionally delete from Linq (only for messages you sent)
    if (syncToLinq && linqMessageId && chatId) {
      try {
        await linqFetch(`/chats/${chatId}/chat_messages/${linqMessageId}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.log("Failed to sync delete to Linq (ok)");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}

