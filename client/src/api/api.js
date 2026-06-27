const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export async function apiPost(path, body = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export function getDiscordLoginUrl() {
  return `${API_URL}/api/auth/discord`;
}