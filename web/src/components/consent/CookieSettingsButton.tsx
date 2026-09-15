"use client";

import { openCookieSettings } from "@/components/consent/CookieConsent";

/** Footer link that re-opens the cookie consent banner. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={
        className ??
        "hover:text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      }
    >
      Cookie settings
    </button>
  );
}
