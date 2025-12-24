"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface Memory {
  id: string;
  content: string;
  category?: string;
  createdAt: number;
  updatedAt?: number;
}

interface MemoryListProps {
  token: string;
}

// iMessage colors
const colors = {
  light: {
    bg: "#FFFFFF",
    cardBg: "#F2F2F7",
    text: "#000000",
    textSecondary: "rgba(0,0,0,0.5)",
    border: "rgba(0,0,0,0.1)",
    accent: "#007AFF",
  },
  dark: {
    bg: "#000000",
    cardBg: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.1)",
    accent: "#0A84FF",
  },
};

const categoryLabels: Record<string, string> = {
  name: "Name",
  birthday: "Birthday",
  hometown: "Hometown",
  job: "Work",
  preference: "Preference",
  like: "Like",
  dislike: "Dislike",
  life: "Life",
  other: "Other",
};

export function MemoryList({ token }: MemoryListProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const theme = isDark ? colors.dark : colors.light;

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch("/api/memories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMemories(data.memories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memories");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;

    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to add");

      setNewContent("");
      setNewCategory("");
      setIsAdding(false);
      fetchMemories();
    } catch {
      alert("Failed to add memory");
    }
  };

  const handleEdit = async (memory: Memory) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch("/api/memories", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memoryId: memory.id,
          content: editContent.trim(),
          category: editCategory || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to edit");

      setEditingId(null);
      setEditContent("");
      setEditCategory("");
      fetchMemories();
    } catch {
      alert("Failed to edit memory");
    }
  };

  const handleDelete = async (memoryId: string) => {
    if (!confirm("Delete this memory?")) return;

    try {
      const res = await fetch(`/api/memories?memoryId=${memoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch {
      alert("Failed to delete memory");
    }
  };

  const startEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
    setEditCategory(memory.category || "");
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
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
            borderColor: theme.accent,
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
          <Button onClick={fetchMemories} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Add new memory button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full mb-4 py-3 rounded-xl text-[15px] font-medium"
          style={{
            backgroundColor: theme.cardBg,
            color: theme.accent,
          }}
        >
          + Add Memory
        </button>
      )}

      {/* Add new memory form */}
      {isAdding && (
        <div
          className="mb-4 p-4 rounded-xl"
          style={{ backgroundColor: theme.cardBg }}
        >
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="What do you want TK to remember?"
            className="w-full bg-transparent text-[15px] resize-none focus:outline-none mb-3"
            style={{ color: theme.text }}
            rows={3}
            autoFocus
          />
          <div className="flex items-center gap-2 mb-3">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 bg-transparent text-[14px] focus:outline-none"
              style={{ color: theme.textSecondary }}
            >
              <option value="">Category (optional)</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewContent("");
                setNewCategory("");
              }}
              className="flex-1 py-2 rounded-lg text-[14px]"
              style={{ color: theme.textSecondary }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="flex-1 py-2 rounded-lg text-[14px] font-medium"
              style={{
                backgroundColor: theme.accent,
                color: "#FFFFFF",
                opacity: newContent.trim() ? 1 : 0.5,
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Memory list */}
      {memories.length === 0 ? (
        <div
          className="flex items-center justify-center h-32 text-[15px]"
          style={{ color: theme.textSecondary }}
        >
          No memories yet
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="p-4 rounded-xl"
              style={{ backgroundColor: theme.cardBg }}
            >
              {editingId === memory.id ? (
                // Edit mode
                <>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-transparent text-[15px] resize-none focus:outline-none mb-3"
                    style={{ color: theme.text }}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="flex-1 bg-transparent text-[14px] focus:outline-none"
                      style={{ color: theme.textSecondary }}
                    >
                      <option value="">No category</option>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 rounded-lg text-[14px]"
                      style={{ color: theme.textSecondary }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEdit(memory)}
                      className="flex-1 py-2 rounded-lg text-[14px] font-medium"
                      style={{ backgroundColor: theme.accent, color: "#FFFFFF" }}
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                // View mode
                <>
                  <p
                    className="text-[15px] mb-2"
                    style={{ color: theme.text }}
                  >
                    {memory.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {memory.category && (
                        <span
                          className="text-[12px] px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: theme.border,
                            color: theme.textSecondary,
                          }}
                        >
                          {categoryLabels[memory.category] || memory.category}
                        </span>
                      )}
                      <span
                        className="text-[12px]"
                        style={{ color: theme.textSecondary }}
                      >
                        {formatDate(memory.createdAt)}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEdit(memory)}
                        className="text-[13px]"
                        style={{ color: theme.accent }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(memory.id)}
                        className="text-[13px]"
                        style={{ color: theme.textSecondary }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
