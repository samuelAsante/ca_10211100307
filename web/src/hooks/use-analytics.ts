"use client";

import { useRef } from "react";
import { useSocket } from "@/components/analytics/socket-provider";
import { EventType } from "@/interface/analytics";
import { usePathname } from "next/navigation";

/**
 * Manual event helpers. Page views are owned by GlobalPageTracker so
 * calling this hook (e.g. on a product card) does not emit a duplicate PAGE_VIEW.
 */
export function useAnalytics() {
  const { emitEvent } = useSocket();
  const pathname = usePathname();
  const lastEventAtRef = useRef<Map<string, number>>(new Map());

  const toStableString = (value: unknown): string => {
    if (value === null || typeof value !== "object") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => toStableString(item)).join(",")}]`;
    }
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${key}:${toStableString(obj[key])}`).join(",")}}`;
  };

  const shouldThrottle = (eventKey: string, throttleMs: number): boolean => {
    if (throttleMs <= 0) return false;
    const now = Date.now();
    const previous = lastEventAtRef.current.get(eventKey);
    if (previous && now - previous < throttleMs) {
      return true;
    }
    lastEventAtRef.current.set(eventKey, now);
    return false;
  };

  const trackEvent = (
    eventType: string,
    metadata?: Record<any, any>,
    options?: { throttleMs?: number; dedupeKey?: string }
  ) => {
    const eventKey =
      options?.dedupeKey ||
      `${eventType}|${pathname || ""}|${toStableString(metadata || {})}`;
    const throttleMs = options?.throttleMs ?? 0;
    if (shouldThrottle(eventKey, throttleMs)) {
      return;
    }

    emitEvent({
      eventType,
      userId: getUserId(),
      sessionId: getSessionId(),
      page: pathname || undefined,
      metadata,
    });
  };

  const trackProductView = (productId: string, productName: string) => {
    trackEvent(
      EventType.PRODUCT_VIEW,
      { productId, productName },
      { throttleMs: 1500, dedupeKey: `${EventType.PRODUCT_VIEW}:${productId}` }
    );
  };

  const trackAddToCart = (productId: string, quantity: number) => {
    trackEvent(
      EventType.ADD_TO_CART,
      { productId, quantity },
      { throttleMs: 1000, dedupeKey: `${EventType.ADD_TO_CART}:${productId}` }
    );
  };

  const trackRemoveFromCart = (productId: string) => {
    trackEvent(
      EventType.REMOVE_FROM_CART,
      { productId },
      { throttleMs: 1000, dedupeKey: `${EventType.REMOVE_FROM_CART}:${productId}` }
    );
  };

  const trackCheckout = (step: "start" | "complete", orderValue?: number) => {
    trackEvent(
      step === "start" ? EventType.CHECKOUT_START : EventType.CHECKOUT_COMPLETE,
      { orderValue },
      { throttleMs: 2000, dedupeKey: `checkout:${step}` }
    );
  };

  const trackSearch = (query: string, resultsCount: number) => {
    trackEvent(EventType.SEARCH, { query, resultsCount });
  };

  return {
    trackEvent,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckout,
    trackSearch,
  };
}

/**
 * Get or create user ID (stored in localStorage)
 */
function getUserId(): string {
  if (typeof window === "undefined") return "server";

  let userId = localStorage.getItem("analytics_user_id");
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("analytics_user_id", userId);
  }
  return userId;
}

/**
 * Get or create session ID (stored in sessionStorage)
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "server";

  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}
