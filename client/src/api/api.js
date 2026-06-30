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
  localStorage.setItem("syxth-auth-event", String(Date.now()));

  window.dispatchEvent(new Event("syxth-auth-changed"));
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.setItem("syxth-auth-event", String(Date.now()));

  window.dispatchEvent(new Event("syxth-auth-changed"));
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

function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeUrl(pathOrUrl) {
  const value = String(pathOrUrl || "");

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_URL}${normalizePath(value)}`;
}

function headersToObject(headers = {}) {
  if (headers instanceof Headers) {
    const result = {};

    headers.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }

  if (Array.isArray(headers)) {
    const result = {};

    new Headers(headers).forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }

  return {
    ...(headers || {}),
  };
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredAuthToken();

  return {
    ...headersToObject(extraHeaders),
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

async function apiRequest(path, options = {}) {
  const response = await fetch(normalizeUrl(path), {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export async function apiGet(path) {
  return apiRequest(path, {
    method: "GET",
  });
}

export async function apiPost(path, body = {}) {
  return apiRequest(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function apiPatch(path, body = {}) {
  return apiRequest(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function apiPut(path, body = {}) {
  return apiRequest(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path, body = null) {
  const options = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return apiRequest(path, options);
}

export async function authFetch(pathOrUrl, options = {}) {
  return fetch(normalizeUrl(pathOrUrl), {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });
}

export function getDiscordLoginUrl() {
  return `${API_URL}/api/auth/discord`;
}

/*
  Mobile fallback:
  Some mobile browsers do not send the Render API session cookie
  from syxthbot-web.onrender.com to syxth-api.onrender.com.

  This patch automatically adds:
  Authorization: Bearer <mobile token>

  to every request going to the configured API URL.
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