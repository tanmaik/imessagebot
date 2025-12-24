"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MagicLinkPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.token as string;

    // Skip if it's "profile" - that's the actual profile page
    if (token === "profile") {
      return;
    }

    let cancelled = false;

    const verifyAndRedirect = async () => {
      try {
        const res = await fetch(`/api/auth/magic?token=${token}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Invalid or expired link");
          return;
        }

        // Store session token
        localStorage.setItem("auth_token", data.token);

        // Redirect to profile
        router.replace("/tk/profile");
      } catch {
        if (!cancelled) {
          setError("Failed to verify link");
        }
      }
    };

    verifyAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [params.token, router]);

  if (error) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <p className="text-black/60 mb-4">{error}</p>
          <p className="text-black/40 text-sm">
            Ask TK for a new login link to access your messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />
    </div>
  );
}
