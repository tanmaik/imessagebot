const LINQ_API_BASE = "https://api.linqapp.com/api/partner/v2";

export async function linqFetch(endpoint: string, options: RequestInit = {}) {
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

export async function sendMessage(chatId: string, text: string) {
  const response = await linqFetch(`/chats/${chatId}/chat_messages`, {
    method: "POST",
    body: JSON.stringify({ message: { text } }),
  });
  return response.json();
}

export async function markAsRead(chatId: string) {
  await linqFetch(`/chats/${chatId}/mark_as_read`, { method: "PUT" });
}

export async function startTyping(chatId: string) {
  await linqFetch(`/chats/${chatId}/start_typing`, { method: "POST" });
}

export async function stopTyping(chatId: string) {
  await linqFetch(`/chats/${chatId}/stop_typing`, { method: "POST" });
}

