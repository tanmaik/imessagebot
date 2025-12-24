"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: string;
  url: string;
  filename?: string;
  mimeType?: string;
}

interface Message {
  id: string;
  linqMessageId?: number;
  text: string;
  sentAt: number | string;
  sentFrom: string;
  isFromMe: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  attachments?: Attachment[];
  reactions?: Array<{ reaction: string; isFromMe: boolean }>;
}

interface MessageListProps {
  token: string;
  chatId?: string;
  onLogout?: () => void;
  hideSignOut?: boolean;
}

const reactionEmoji: Record<string, string> = {
  love: "❤️",
  like: "👍",
  dislike: "👎",
  laugh: "😂",
  emphasize: "‼️",
  question: "❓",
};

// iMessage colors - accurate to iOS
const colors = {
  light: {
    bg: "#FFFFFF",
    blueBubble: "#007AFF",
    grayBubble: "#E5E5EA",
    text: "#000000",
    textOnBlue: "#FFFFFF",
    textOnGray: "#000000",
    timestamp: "rgba(0,0,0,0.3)",
    headerBg: "#FFFFFF",
    overlay: "rgba(0,0,0,0.1)",
    fileBg: "rgba(255,255,255,0.2)",
    fileBgHover: "rgba(255,255,255,0.3)",
    grayFileBg: "#D1D1D6",
    grayFileBgHover: "#C7C7CC",
    reactionBg: "#FFFFFF",
    reactionBorder: "rgba(0,0,0,0.1)",
  },
  dark: {
    bg: "#000000",
    blueBubble: "#0A84FF",
    grayBubble: "#262629",
    text: "#FFFFFF",
    textOnBlue: "#FFFFFF",
    textOnGray: "#FFFFFF",
    timestamp: "rgba(255,255,255,0.35)",
    headerBg: "#000000",
    overlay: "rgba(0,0,0,0.5)",
    fileBg: "rgba(255,255,255,0.15)",
    fileBgHover: "rgba(255,255,255,0.25)",
    grayFileBg: "#3A3A3C",
    grayFileBgHover: "#48484A",
    reactionBg: "#1C1C1E",
    reactionBorder: "rgba(255,255,255,0.15)",
  },
};

export function MessageList({ token, chatId, onLogout, hideSignOut }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>("UTC");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect system dark mode preference and user timezone
  useEffect(() => {
    // Get user's timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(tz);

    // Detect dark mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const theme = isDark ? colors.dark : colors.light;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages?limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedDate]);

  const handleDelete = async (msg: Message) => {
    try {
      const params = new URLSearchParams({
        messageId: msg.id,
        syncToLinq: msg.isFromMe ? "true" : "false",
        ...(msg.linqMessageId && {
          linqMessageId: msg.linqMessageId.toString(),
        }),
        ...(chatId && { chatId }),
      });

      const res = await fetch(`/api/messages?${params}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      setSelectedId(null);
    } catch {
      alert("Failed to delete message");
    }
  };

  const handleTouchStart = (msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedId(msgId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const parseTimestamp = (ts: number | string): number => {
    if (typeof ts === "number") return ts;
    const parsed = new Date(ts).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
  };

  // Format time in user's timezone
  const formatTime = (ts: number | string) => {
    const date = new Date(parseTimestamp(ts));
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      timeZone: userTimezone,
    });
  };

  // Get date string in user's timezone
  const getDateInUserTz = (ts: number | string): string => {
    const date = new Date(parseTimestamp(ts));
    return date.toLocaleDateString("en-CA", { timeZone: userTimezone }); // en-CA gives YYYY-MM-DD format
  };

  // Get unique dates from messages (in user's timezone)
  const availableDates = [
    ...new Set(messages.map((m) => getDateInUserTz(m.sentAt))),
  ]
    .sort()
    .reverse();

  // Filter messages for selected date (in user's timezone)
  const filteredMessages = messages.filter((m) => {
    return getDateInUserTz(m.sentAt) === selectedDate;
  });

  // Get today's date in user's timezone
  const getTodayInUserTz = (): string => {
    return new Date().toLocaleDateString("en-CA", { timeZone: userTimezone });
  };

  const formatDateLabel = (dateStr: string) => {
    const today = getTodayInUserTz();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA", {
      timeZone: userTimezone,
    });

    if (dateStr === today) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";

    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: userTimezone,
    });
  };

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div
          className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent"
          style={{
            borderColor: theme.blueBubble,
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="text-center">
          <p className="text-red-500 mb-4 text-sm">{error}</p>
          <Button onClick={fetchMessages} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sticky header with date picker and sign out */}
      <header
        className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: theme.headerBg }}
      >
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="font-medium text-[15px] bg-transparent focus:outline-none cursor-pointer"
          style={{ color: theme.text }}
        >
          {availableDates.length === 0 ? (
            <option value={selectedDate}>Today</option>
          ) : (
            availableDates.map((date) => (
              <option
                key={date}
                value={date}
                style={{ backgroundColor: theme.bg, color: theme.text }}
              >
                {formatDateLabel(date)}
              </option>
            ))
          )}
        </select>

        {!hideSignOut && onLogout && (
          <button
            onClick={onLogout}
            className="font-medium text-[15px]"
            style={{ color: theme.text }}
          >
            Sign Out
          </button>
        )}
      </header>

      {/* Scrollable messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-4"
        style={{ backgroundColor: theme.bg }}
      >
        {selectedId && (
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: theme.overlay }}
            onClick={() => setSelectedId(null)}
          />
        )}

        {filteredMessages.length === 0 ? (
          <div
            className="flex items-center justify-center h-full text-[15px]"
            style={{ color: theme.timestamp }}
          >
            No messages on this day
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredMessages.map((msg, i) => {
              const isUser = !msg.isFromMe;
              const isSelected = selectedId === msg.id;
              const prev = filteredMessages[i - 1];
              const next = filteredMessages[i + 1];
              const sameSenderAsPrev = prev && prev.isFromMe === msg.isFromMe;
              const sameSenderAsNext = next && next.isFromMe === msg.isFromMe;

              const isFirst = !sameSenderAsPrev;
              const isLast = !sameSenderAsNext;

              // Show time separator if gap > 15 minutes from previous message
              const prevTime = prev ? parseTimestamp(prev.sentAt) : 0;
              const currTime = parseTimestamp(msg.sentAt);
              const showTimeSeparator =
                !prev || currTime - prevTime > 15 * 60 * 1000;

              return (
                <div key={msg.id}>
                  {/* Time separator */}
                  {showTimeSeparator && (
                    <div className="flex justify-center py-3">
                      <span
                        className="text-[12px] font-semibold"
                        style={{ color: theme.timestamp }}
                      >
                        {formatTime(msg.sentAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
                    onMouseEnter={() => setHoveredId(msg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Delete button - desktop hover (left side for user messages) */}
                    {isUser && hoveredId === msg.id && (
                      <button
                        onClick={() => handleDelete(msg)}
                        className="self-center mr-2 px-2 py-1 text-[13px] hidden sm:block"
                        style={{ color: theme.timestamp }}
                      >
                        Delete
                      </button>
                    )}

                    <div
                      className={`relative max-w-[80%] ${isFirst && !showTimeSeparator ? "mt-3" : ""}`}
                      onTouchStart={() => handleTouchStart(msg.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                    >
                      {/* Images - borderless, separate from bubble */}
                      {msg.attachments &&
                        msg.attachments.filter((a) =>
                          a.mimeType?.startsWith("image/")
                        ).length > 0 && (
                          <div className="space-y-1 mb-1">
                            {msg.attachments
                              .filter((a) => a.mimeType?.startsWith("image/"))
                              .map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.filename || "Image"}
                                    className="max-w-full rounded-2xl max-h-64 object-cover"
                                  />
                                </a>
                              ))}
                          </div>
                        )}

                      {/* Videos - separate from bubble */}
                      {msg.attachments &&
                        msg.attachments.filter((a) =>
                          a.mimeType?.startsWith("video/")
                        ).length > 0 && (
                          <div className="space-y-1 mb-1">
                            {msg.attachments
                              .filter((a) => a.mimeType?.startsWith("video/"))
                              .map((att) => (
                                <video
                                  key={att.id}
                                  src={att.url}
                                  controls
                                  className="max-w-full rounded-2xl max-h-64"
                                  preload="metadata"
                                />
                              ))}
                          </div>
                        )}

                      {/* Message bubble - only if there's text or non-media attachments */}
                      {(msg.text ||
                        msg.attachments?.some(
                          (a) =>
                            !a.mimeType?.startsWith("image/") &&
                            !a.mimeType?.startsWith("video/")
                        )) && (
                        <div
                          className="relative px-3 py-[6px]"
                          style={{
                            backgroundColor: isUser
                              ? theme.blueBubble
                              : theme.grayBubble,
                            color: isUser ? theme.textOnBlue : theme.textOnGray,
                            borderRadius: isUser
                              ? `18px ${isFirst ? "18px" : "4px"} ${isLast ? "4px" : "4px"} 18px`
                              : `${isFirst ? "18px" : "4px"} 18px 18px ${isLast ? "4px" : "4px"}`,
                          }}
                        >
                          {/* Audio attachments */}
                          {msg.attachments &&
                            msg.attachments
                              .filter((a) => a.mimeType?.startsWith("audio/"))
                              .map((att) => (
                                <audio
                                  key={att.id}
                                  src={att.url}
                                  controls
                                  className="max-w-full mb-1"
                                  preload="metadata"
                                />
                              ))}

                          {/* File attachments */}
                          {msg.attachments &&
                            msg.attachments
                              .filter(
                                (a) =>
                                  !a.mimeType?.startsWith("image/") &&
                                  !a.mimeType?.startsWith("video/") &&
                                  !a.mimeType?.startsWith("audio/")
                              )
                              .map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-1"
                                  style={{
                                    backgroundColor: isUser
                                      ? theme.fileBg
                                      : theme.grayFileBg,
                                  }}
                                >
                                  <span>📎</span>
                                  <span className="truncate">
                                    {att.filename || "Download"}
                                  </span>
                                </a>
                              ))}

                          {/* Text with links */}
                          {msg.text && (
                            <p className="text-[17px] leading-[22px] whitespace-pre-wrap break-words">
                              {msg.text
                                .split(/(https?:\/\/[^\s]+)/g)
                                .map((part, idx) => {
                                  if (part.match(/^https?:\/\//)) {
                                    return (
                                      <a
                                        key={idx}
                                        href={part}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline"
                                      >
                                        {part}
                                      </a>
                                    );
                                  }
                                  return part;
                                })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Reactions - iMessage tapback style */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div
                          className={`absolute -top-3 ${
                            isUser ? "-left-1" : "-right-1"
                          } flex items-center rounded-full px-1 py-0.5 border`}
                          style={{
                            backgroundColor: theme.reactionBg,
                            borderColor: theme.reactionBorder,
                          }}
                        >
                          {msg.reactions.map((r, ri) => (
                            <span key={ri} className="text-xs">
                              {reactionEmoji[r.reaction] || r.reaction}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Edited indicator */}
                      {msg.isEdited && isLast && (
                        <div
                          className={`text-[11px] mt-0.5 ${
                            isUser ? "text-right pr-1" : "text-left pl-1"
                          }`}
                          style={{ color: theme.timestamp }}
                        >
                          Edited
                        </div>
                      )}

                      {/* Long press menu - mobile only */}
                      {isSelected && (
                        <div
                          className={`absolute ${
                            isUser ? "right-0" : "left-0"
                          } -top-10 z-50 sm:hidden`}
                        >
                          <button
                            onClick={() => handleDelete(msg)}
                            className="px-4 py-2 text-[15px] rounded-lg border"
                            style={{
                              backgroundColor: theme.reactionBg,
                              color: theme.text,
                              borderColor: theme.reactionBorder,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete button - desktop hover (right side for AI messages) */}
                    {!isUser && hoveredId === msg.id && (
                      <button
                        onClick={() => handleDelete(msg)}
                        className="self-center ml-2 px-2 py-1 text-[13px] hidden sm:block"
                        style={{ color: theme.timestamp }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </>
  );
}
