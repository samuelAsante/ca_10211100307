export function getBackendUrl(): string {
  const prodBackend = "https://js-ashanti-api.onrender.com";
  const devBackend = "http://localhost:4001";
  const fallback = process.env.NODE_ENV === "production" ? prodBackend : devBackend;

  const sanitize = (url?: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim().replace(/\/$/, "");
    if (!trimmed) return null;
    if (
      trimmed.includes("js-ashanti-api:") ||
      trimmed.includes("http://js-ashanti-api") ||
      (process.env.NODE_ENV === "production" && trimmed.includes("localhost:4001"))
    ) {
      return null;
    }
    return trimmed;
  };

  if (typeof window === "undefined") {
    const internal = sanitize(process.env.BACKEND_INTERNAL_URL);
    if (internal) return internal;

    const nextPublic = sanitize(process.env.NEXT_PUBLIC_BACKEND_URL);
    if (nextPublic) return nextPublic;

    return fallback;
  }

  const clientUrl = sanitize(process.env.NEXT_PUBLIC_BACKEND_URL);
  return clientUrl || fallback;
}
