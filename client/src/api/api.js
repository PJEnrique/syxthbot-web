export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Server returned invalid JSON.");
  }
}

function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

export async function apiGet(path) {
  const response = await fetch(`${API_URL}${normalizePath(path)}`, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export async function apiPost(path, body = {}) {
  const response = await fetch(`${API_URL}${normalizePath(path)}`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export function getDiscordLoginUrl() {
  return `${API_URL}/api/auth/discord`;
}
