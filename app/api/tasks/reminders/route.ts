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

// PATCH - Cancel a reminder
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

    const { reminderId } = await request.json();

    if (!reminderId) {
      return NextResponse.json({ error: "reminderId required" }, { status: 400 });
    }

    await convex.mutation(api.reminders.cancelReminderFromDashboard, {
      reminderId: reminderId as Id<"scheduledReminders">,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}
