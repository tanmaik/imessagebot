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

// GET - Fetch tasks with reminders
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
      return NextResponse.json({ tasks: [] });
    }

    const tasks = await convex.query(api.tasks.listTasks, {
      chatId: user.chatId,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// PATCH - Update a task
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

    const { taskId, title, description, dueAt, eventAt, status } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    await convex.mutation(api.tasks.updateTaskFromDashboard, {
      taskId: taskId as Id<"tasks">,
      title,
      description,
      dueAt,
      eventAt,
      status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE - Delete a task
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
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    await convex.mutation(api.tasks.deleteTaskFromDashboard, {
      taskId: taskId as Id<"tasks">,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
