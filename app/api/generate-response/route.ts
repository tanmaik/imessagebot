import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/upstash";

const LINQ_API_BASE = "https://api.linqapp.com/api/partner/v2";

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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handler(request: NextRequest) {
  const { chatId } = await request.json();

  console.log(`[generate-response] Starting for chat ${chatId}`);

  // Get the timeline and events
  const timeline = await redis.lrange(`chat:${chatId}:timeline`, 0, -1);
  const rawEvents = await redis.lrange(`chat:${chatId}:events`, 0, -1);

  console.log(`[generate-response] Found ${rawEvents.length} raw events, ${timeline.length} timeline entries`);

  // Clear all the buffers
  await redis.del(`chat:${chatId}:events`);
  await redis.del(`chat:${chatId}:timeline`);
  await redis.del(`chat:${chatId}:jobId`);
  await redis.del(`chat:${chatId}:timerStart`);
  await redis.del(`chat:${chatId}:timerDuration`);

  // If no events, do nothing
  if (rawEvents.length === 0) {
    console.log(`[generate-response] No events, skipping`);
    return NextResponse.json({ skipped: true });
  }

  // Parse events and filter for actual messages only
  const events = rawEvents.map((e) =>
    typeof e === "string" ? JSON.parse(e) : e
  );

  const messageEvents = events.filter(
    (e) => e.event_type === "message.received"
  );

  console.log(`[generate-response] Found ${messageEvents.length} actual messages`);

  // If no actual messages (just typing indicators), do nothing
  if (messageEvents.length === 0) {
    console.log(`[generate-response] No messages received, just typing indicators - skipping`);
    return NextResponse.json({ skipped: true, reason: "no_messages" });
  }

  // Step 1: Mark chat as read
  console.log(`[generate-response] Marking chat ${chatId} as read`);
  await linqFetch(`/chats/${chatId}/mark_as_read`, { method: "PUT" });

  // Step 2: Start typing indicator
  console.log(`[generate-response] Starting typing indicator`);
  await linqFetch(`/chats/${chatId}/start_typing`, { method: "POST" });

  // Step 3: Wait 5 seconds (simulating "thinking")
  await sleep(5000);

  // Build debug response from timeline
  const timelineMessage = [
    ...timeline,
    "timer expired - responding now"
  ].join("\n\n");

  // Step 4: Send message (this auto-removes typing indicator)
  console.log(`[generate-response] Sending message`);
  const messageResponse = await linqFetch(`/chats/${chatId}/chat_messages`, {
    method: "POST",
    body: JSON.stringify({ message: { text: timelineMessage } }),
  });

  const result = await messageResponse.json();
  console.log(`[generate-response] Message sent:`, result);

  return NextResponse.json({ success: true, message: result });
}

export async function POST(request: NextRequest) {
  // Verify QStash signature in production
  if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
    const { verifySignatureAppRouter } = await import("@upstash/qstash/nextjs");
    return verifySignatureAppRouter(handler)(request);
  }

  // Dev mode - no verification
  return handler(request);
}

