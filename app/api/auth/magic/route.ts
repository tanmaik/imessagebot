import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);

    const result = await convex.mutation(api.auth.verifyMagicLink, { token });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Error verifying magic link:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

