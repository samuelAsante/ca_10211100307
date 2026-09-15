"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  getConsent,
  setConsent,
  type ConsentValue,
} from "@/lib/consent";

/**
 * Cookie consent banner. Shows on first visit until the user makes a choice.
 * Analytics tracking is gated on the user accepting here (see socket-provider).
 * Re-opens when the "Cookie settings" footer link dispatches the consent event
 * with no stored choice, or via the exported `openCookieSettings` helper.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show the banner if no choice has been stored yet.
    setVisible(getConsent() === null);

    const handleOpen = () => setVisible(true);
    window.addEventListener("open-cookie-settings", handleOpen);
    return () => window.removeEventListener("open-cookie-settings", handleOpen);
  }, []);

  const choose = (value: ConsentValue) => {
    setConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xl p-5 sm:p-6">
        <h2 id="cookie-consent-title" className="text-base font-semibold">
          We value your privacy
        </h2>
        <p
          id="cookie-consent-desc"
          className="mt-2 text-sm text-neutral-700 dark:text-neutral-300"
        >
          We use strictly necessary cookies to make the store work. With your
          consent, we also use analytics cookies to understand how the site is
          used and improve it. Read our{" "}
          <Link
            href="/cookie-policy"
            className="underline underline-offset-2 text-blue-700 dark:text-blue-400"
          >
            Cookie Policy
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="order-2 sm:order-1 inline-flex items-center justify-center rounded-md border border-neutral-400 dark:border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="order-1 sm:order-2 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

/** Programmatically re-open the cookie banner (used by the footer link). */
export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("open-cookie-settings"));
}

// Keep the import referenced so tree-shakers don't flag it if unused elsewhere.
export { CONSENT_EVENT };
