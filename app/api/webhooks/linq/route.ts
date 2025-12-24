import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const TK_PHONE_NUMBER = "+15715716823";
const LINQ_API_BASE = "https://api.linqapp.com/api/partner/v2";

// Helper to call Linq API from webhook
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

// Verify the webhook signature from Linq
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expectedSignature = signature.replace(/^sha256=/, "");
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Parse timestamp from Linq format
function parseLinqTimestamp(timestamp: string | undefined): number {
  if (!timestamp) return Date.now();
  const parsed = new Date(timestamp).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

// Get the other party's phone number from chat_handles
interface ChatHandle {
  identifier: string;
  is_me: boolean;
}

function getOtherPartyPhone(chatHandles: ChatHandle[] | undefined): string {
  if (!chatHandles) return "";
  const other = chatHandles.find((h) => !h.is_me);
  return other?.identifier || "";
}

export async function POST(request: NextRequest) {
  const secret = process.env.LINQ_WEBHOOK_SECRET;

  if (!secret) {
    console.error("LINQ_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  if (!verifySignature(payload, signature, secret)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(payload);
  console.log(`[Webhook] ${event.event_id} - ${event.event_type}`);

  // Only process in production
  const isProduction = process.env.VERCEL_ENV === "production";

  if (isProduction) {
    try {
      await handleWebhook(event);
    } catch (error) {
      console.error("Error handling webhook:", error);
    }
  }

  return NextResponse.json({ received: true });
}

interface LinqWebhookEvent {
  event_id: string;
  event_type: string;
  created_at: string;
  data: {
    id?: string | number;
    chat_id?: string;
    text?: string;
    sent_at?: string;
    is_read?: boolean;
    from_phone?: string;
    service?: string;
    chat_handles?: Array<{
      identifier: string;
      display_name?: string;
      is_me: boolean;
    }>;
    attachments?: Array<{
      id: string;
      url: string;
      filename?: string;
      mime_type?: string;
    }>;
    // Reaction events
    chat_message_id?: string;
    reaction?: string;
    is_from_me?: boolean;
    chat_handle?: { identifier: string };
    associated_message?: { id: string; text: string; sent_at: string };
    [key: string]: unknown;
  };
}

async function handleWebhook(event: LinqWebhookEvent) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL not configured");
    return;
  }

  const convex = new ConvexHttpClient(convexUrl);
  const chatId = event.data.chat_id;

  switch (event.event_type) {
    case "message.received":
      // Incoming user message - store in Convex (triggers agent via DB)
      if (chatId) {
        await handleMessage(convex, chatId, event, true); // triggerAgent = true
      }
      break;

    case "message.sent":
      // Outgoing TK message - store as backup (agent already stores it)
      if (chatId) {
        await handleMessage(convex, chatId, event, false); // triggerAgent = false
      }
      break;

    case "reaction.received":
    case "reaction.sent":
      if (chatId) {
        await handleReaction(convex, event);
      }
      break;

    case "message.read":
      console.log(`[Webhook] Message read: ${event.data.id}`);
      break;

    default:
      console.log(`[Webhook] Ignoring event type: ${event.event_type}`);
  }

  // Agent is now triggered by the database (messages.store mutation)
  // No need to call spawnAgentIfNeeded here
}

async function handleMessage(
  convex: ConvexHttpClient,
  chatId: string,
  event: LinqWebhookEvent,
  triggerAgent: boolean
) {
  try {
    const service = event.data.service;

    // BLOCK GROUP CHATS - count non-me participants
    const chatHandles = event.data.chat_handles || [];
    const otherParticipants = chatHandles.filter((h) => !h.is_me);
    if (otherParticipants.length > 1) {
      console.log(`[Webhook] BLOCKING group chat ${chatId} - ${otherParticipants.length} participants`);
      return; // Don't store, don't trigger agent for group chats
    }

    // BLOCK SMS - never interact via SMS
    if (service === "SMS") {
      console.log(`[Webhook] BLOCKING SMS message for chat ${chatId} - we only support iMessage/RCS`);
      return; // Don't store, don't trigger agent
    }

    const isFromMe = event.event_type === "message.sent";
    const otherPhone = getOtherPartyPhone(event.data.chat_handles);
    const sentFrom = isFromMe ? TK_PHONE_NUMBER : (event.data.from_phone || otherPhone);

    // Ensure chat exists with service type
    await convex.mutation(api.chats.getOrCreate, {
      chatId,
      phoneNumber: isFromMe ? otherPhone : sentFrom,
      service,
    });

    // Store message - this will trigger agent if triggerAgent=true and isFromMe=false
    const messageId = typeof event.data.id === "string"
      ? parseInt(event.data.id)
      : event.data.id;

    await convex.mutation(api.messages.store, {
      chatId,
      linqMessageId: messageId,
      text: event.data.text || "",
      sentAt: parseLinqTimestamp(event.data.sent_at),
      sentFrom,
      isFromMe,
      service,
      isRead: event.data.is_read,
      attachments: event.data.attachments?.map((a) => ({
        id: a.id,
        url: a.url,
        filename: a.filename,
        mimeType: a.mime_type,
      })),
      triggerAgent,
    });

    console.log(`[Webhook] Stored message ${messageId} for chat ${chatId} (triggerAgent: ${triggerAgent})`);

    // If agent is already active for this chat, send immediate read receipt
    if (!isFromMe && triggerAgent) {
      try {
        const isAgentActive = await convex.query(api.agentQueries.isAgentActive, { chatId });
        if (isAgentActive) {
          await linqFetch(`/chats/${chatId}/mark_as_read`, { method: "PUT" });
          console.log(`[Webhook] Sent read receipt - agent already active for ${chatId}`);
        }
      } catch (e) {
        console.log(`[Webhook] Read receipt check failed (ok)`);
      }
    }
  } catch (error) {
    console.error("[Webhook] Error storing message:", error);
  }
}

async function handleReaction(convex: ConvexHttpClient, event: LinqWebhookEvent) {
  try {
    const messageId = event.data.chat_message_id
      ? parseInt(event.data.chat_message_id)
      : undefined;

    if (!messageId) {
      console.log("[Webhook] Reaction event missing chat_message_id");
      return;
    }

    const reaction = {
      id: typeof event.data.id === "string" ? parseInt(event.data.id) : (event.data.id || 0),
      reaction: event.data.reaction || "",
      isFromMe: event.data.is_from_me || false,
      fromPhone: event.data.chat_handle?.identifier || "",
    };

    await convex.mutation(api.messages.addReaction, {
      linqMessageId: messageId,
      reaction,
    });

    console.log(`[Webhook] Added reaction to message ${messageId}`);
  } catch (error) {
    console.error("[Webhook] Error handling reaction:", error);
  }
}
