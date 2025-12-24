"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageList } from "@/components/dashboard/MessageList";
import { MemoryList } from "@/components/dashboard/MemoryList";
import { NotificationsList } from "@/components/dashboard/NotificationsList";

interface User {
  id: string;
  phoneNumber: string;
  chatId?: string;
}

type Tab = "messages" | "memory" | "notifications";

// Tab styling colors
const tabColors = {
  light: {
    bg: "#FFFFFF",
    text: "#000000",
    textInactive: "rgba(0,0,0,0.4)",
    accent: "#007AFF",
    border: "rgba(0,0,0,0.1)",
  },
  dark: {
    bg: "#000000",
    text: "#FFFFFF",
    textInactive: "rgba(255,255,255,0.4)",
    accent: "#0A84FF",
    border: "rgba(255,255,255,0.1)",
  },
};

function ProfileContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const theme = isDark ? tabColors.dark : tabColors.light;

  useEffect(() => {
    // Check for magic link token in URL
    const magicToken = searchParams.get("token");

    if (magicToken) {
      verifyMagicLink(magicToken);
    } else {
      // Check for existing session
      const storedToken = localStorage.getItem("auth_token");
      if (storedToken) {
        validateToken(storedToken);
      } else {
        setLoading(false);
      }
    }
  }, [searchParams]);

  const verifyMagicLink = async (magicToken: string) => {
    try {
      const res = await fetch(`/api/auth/magic?token=${magicToken}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid or expired link");
        setLoading(false);
        return;
      }

      // Store session and set user
      localStorage.setItem("auth_token", data.token);
      setToken(data.token);
      setUser(data.user);

      // Remove token from URL for cleaner look
      window.history.replaceState({}, "", "/tk/profile");
    } catch {
      setError("Failed to verify link");
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (storedToken: string) => {
    try {
      const res = await fetch("/api/messages?limit=1", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.ok) {
        setToken(storedToken);
        setUser({ id: "", phoneNumber: "", chatId: undefined });
      } else {
        localStorage.removeItem("auth_token");
      }
    } catch {
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch {}
    }
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div
        className="h-[100dvh] flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div
          className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent"
          style={{ borderColor: theme.accent, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="h-[100dvh] flex items-center justify-center px-6"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="text-center">
          <p style={{ color: theme.textInactive }} className="mb-4">
            {error}
          </p>
          <p style={{ color: theme.textInactive }} className="text-sm">
            Ask TK for a new login link to access your messages.
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div
        className="h-[100dvh] flex items-center justify-center px-6"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="text-center">
          <h1
            className="text-xl font-medium mb-2"
            style={{ color: theme.text }}
          >
            Message History
          </h1>
          <p style={{ color: theme.textInactive }} className="text-sm">
            Text TK and ask for a login link to see your messages here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Tab navigation */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: theme.border }}
      >
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("messages")}
            className="py-1 text-[15px] font-medium"
            style={{
              color: activeTab === "messages" ? theme.accent : theme.textInactive,
            }}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab("memory")}
            className="py-1 text-[15px] font-medium"
            style={{
              color: activeTab === "memory" ? theme.accent : theme.textInactive,
            }}
          >
            Memory
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className="py-1 text-[15px] font-medium"
            style={{
              color: activeTab === "notifications" ? theme.accent : theme.textInactive,
            }}
          >
            Tasks
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="text-[15px]"
          style={{ color: theme.text }}
        >
          Sign Out
        </button>
      </div>

      {/* Content */}
      {activeTab === "messages" && (
        <MessageList token={token} chatId={user?.chatId} hideSignOut />
      )}
      {activeTab === "memory" && (
        <MemoryList token={token} />
      )}
      {activeTab === "notifications" && (
        <NotificationsList token={token} />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#007AFF] border-t-transparent" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
