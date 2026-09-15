import { getBackendUrl } from "@/lib/backend-url";

export async function fetchBackend(
  path: string,
  init?: RequestInit
): Promise<Response | null> {
  try {
    return await fetch(`${getBackendUrl()}${path}`, init);
  } catch (error) {
    console.error(`[backend] ${path} failed:`, error);
    return null;
  }
}
