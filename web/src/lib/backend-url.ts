export function getBackendUrl(): string {
  const prodBackend = "https://js-ashanti-api.onrender.com";
  const devBackend = "http://localhost:4001";
  const fallback = process.env.NODE_ENV === "production" ? prodBackend : devBackend;

  if (typeof window === "undefined") {
    return (
      process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
      fallback
    );
  }

  return process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || fallback;
}
