export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const AUTH_TOKEN_KEY = "syxth.mobile.auth.token";

export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function saveStoredAuthToken(token) {
  if (typeof window === "undefined") return;
  if (!token) return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function consumeAuthTokenFromUrl() {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");

  if (!token) return null;

  saveStoredAuthToken(token);

  url.searchParams.delete("token");
  window.history.replaceState({}, document.title, url.toString());

  return token;
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredAuthToken();

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
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

/*
  Mobile fallback:
  Some mobile browsers do not send the Render API session cookie
  from syxthbot-web.onrender.com to syxthbot-api.onrender.com.
  This patch adds the mobile auth token automatically to API requests.
*/
if (typeof window !== "undefined" && !window.__syxthFetchPatched) {
  window.__syxthFetchPatched = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input?.url || "";

    const isApiRequest = requestUrl.startsWith(API_URL);
    const token = getStoredAuthToken();

    if (!isApiRequest || !token) {
      return nativeFetch(input, init);
    }

    const existingHeaders = new Headers(init.headers || {});

    if (!existingHeaders.has("Authorization")) {
      existingHeaders.set("Authorization", `Bearer ${token}`);
    }

    return nativeFetch(input, {
      ...init,
      credentials: init.credentials || "include",
      cache: init.cache || "no-store",
      headers: existingHeaders,
    });
  };
}