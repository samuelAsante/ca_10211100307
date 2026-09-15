export function getBackendUrl(): string {
  const fallback = "http://localhost:4001";

  if (typeof window === "undefined") {
    return (
      process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
      fallback
    );
  }

  return process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || fallback;
}
