import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Verify auth and get user
async function getAuthUser(request: NextRequest, convex: ConvexHttpClient) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return null;

  return await convex.query(api.auth.getCurrentUser, { token });
}

// GET - Fetch memories
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
      return NextResponse.json({ memories: [] });
    }

    const memories = await convex.query(api.memories.listMemories, {
      chatId: user.chatId,
    });

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Error fetching memories:", error);
    return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 });
  }
}

// POST - Add a new memory
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "No chat associated with user" }, { status: 400 });
    }

    const { content, category } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const memoryId = await convex.mutation(api.memories.addMemory, {
      chatId: user.chatId,
      content,
      category,
    });

    return NextResponse.json({ success: true, memoryId });
  } catch (error) {
    console.error("Error adding memory:", error);
    return NextResponse.json({ error: "Failed to add memory" }, { status: 500 });
  }
}

// PATCH - Edit a memory
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

    const { memoryId, content, category } = await request.json();

    if (!memoryId || !content) {
      return NextResponse.json({ error: "memoryId and content required" }, { status: 400 });
    }

    await convex.mutation(api.memories.updateMemory, {
      memoryId: memoryId as Id<"memories">,
      content,
      category,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error editing memory:", error);
    return NextResponse.json({ error: "Failed to edit memory" }, { status: 500 });
  }
}

// DELETE - Remove a memory
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
    const memoryId = searchParams.get("memoryId");

    if (!memoryId) {
      return NextResponse.json({ error: "memoryId required" }, { status: 400 });
    }

    await convex.mutation(api.memories.removeMemory, {
      memoryId: memoryId as Id<"memories">,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
  }
}
