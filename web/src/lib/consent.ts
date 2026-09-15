/**
 * Lightweight cookie/analytics consent utilities.
 *
 * Consent is stored in localStorage so it persists across sessions. Only
 * "strictly necessary" functionality runs without consent; analytics events
 * are gated on `analytics` consent being granted.
 */

export const CONSENT_STORAGE_KEY = "cookie_consent";
export const CONSENT_EVENT = "cookie-consent-change";

export type ConsentValue = "accepted" | "rejected";

export interface ConsentState {
  analytics: ConsentValue;
  /** ISO timestamp of when the choice was made. */
  updatedAt: string;
}

/** Read the stored consent state, or null if the user hasn't chosen yet. */
export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed?.analytics === "accepted" || parsed?.analytics === "rejected") {
      return {
        analytics: parsed.analytics,
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** True only when the user has explicitly accepted analytics cookies. */
export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === "accepted";
}

/** Persist a consent choice and notify listeners in the current tab. */
export function setConsent(analytics: ConsentValue): void {
  if (typeof window === "undefined") return;
  const state: ConsentState = {
    analytics,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));

  // If the user withdraws analytics consent, drop any identifiers we set.
  if (analytics === "rejected") {
    try {
      window.localStorage.removeItem("analytics_user_id");
      window.sessionStorage.removeItem("analytics_session_id");
    } catch {
      /* ignore */
    }
  }

  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
}
