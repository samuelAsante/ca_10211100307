import { getBackendUrl } from "@/lib/backend-url";

export async function fetchBackend(
  path: string,
  init?: RequestInit
): Promise<Response | null> {
  const primaryUrl = getBackendUrl();
  const prodFallback = "https://js-ashanti-api.onrender.com";

  try {
    const res = await fetch(`${primaryUrl}${path}`, init);
    if (res.ok) return res;
    console.warn(`[backend] ${primaryUrl}${path} returned status ${res.status}`);
  } catch (error) {
    console.error(`[backend] ${primaryUrl}${path} failed:`, error);
  }

  if (primaryUrl !== prodFallback) {
    try {
      console.log(`[backend] Retrying ${path} with fallback ${prodFallback}`);
      const res = await fetch(`${prodFallback}${path}`, init);
      if (res.ok) return res;
    } catch (fallbackError) {
      console.error(`[backend] fallback ${prodFallback}${path} failed:`, fallbackError);
    }
  }

  return null;
}
