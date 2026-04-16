const trim = (value: string) => value.trim();

/** REST API base, e.g. https://host/api — no trailing slash */
export function getApiBaseUrl(): string {
  const primary = import.meta.env.VITE_API_BASE_URL;
  if (primary != null && trim(String(primary)) !== "") {
    return String(primary).replace(/\/$/, "");
  }
  const backend = import.meta.env.VITE_BACKEND_URL;
  if (backend != null && trim(String(backend)) !== "") {
    const b = String(backend).replace(/\/$/, "");
    return b.endsWith("/api") ? b : `${b}/api`;
  }
  if (import.meta.env.DEV) {
    console.warn(
      "VITE_API_BASE_URL (or VITE_BACKEND_URL) is not set; API calls may fail.",
    );
  }
  return "";
}

/** Socket.IO origin — strip /api from API base when VITE_SOCKET_URL is unset */
export function getSocketUrl(): string {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit != null && trim(String(explicit)) !== "") {
    return String(explicit).replace(/\/$/, "");
  }
  const api = getApiBaseUrl();
  if (!api) return "";
  return api.replace(/\/api$/, "");
}

export const apiBaseUrl = getApiBaseUrl();
export const socketUrl = getSocketUrl();
