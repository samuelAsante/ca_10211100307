"use client";

import { useRef, useCallback } from "react";
import { useSocket } from "@/components/analytics/socket-provider";
import { EventType } from "@/interface/analytics";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";

/**
 * Manual event helpers. Page views are owned by GlobalPageTracker so
 * calling this hook (e.g. on a product card) does not emit a duplicate PAGE_VIEW.
 */
export function useAnalytics() {
  const { emitEvent } = useSocket();
  const pathname = usePathname();
  const { data: session } = useSession();
  const lastEventAtRef = useRef<Map<string, number>>(new Map());

  const toStableString = useCallback((value: unknown): string => {
    if (value === null || typeof value !== "object") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => toStableString(item)).join(",")}]`;
    }
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${key}:${toStableString(obj[key])}`).join(",")}}`;
  }, []);

  const shouldThrottle = useCallback((eventKey: string, throttleMs: number): boolean => {
    if (throttleMs <= 0) return false;
    const now = Date.now();
    const previous = lastEventAtRef.current.get(eventKey);
    if (previous && now - previous < throttleMs) {
      return true;
    }
    lastEventAtRef.current.set(eventKey, now);
    return false;
  }, []);

  const currentUserId = session?.user?.id || getUserId();
  const userRole = (session?.user as any)?.role || "guest";
  const defaultDomain: "storefront" | "admin" = pathname?.startsWith("/admin") ? "admin" : "storefront";

  const trackEvent = useCallback((
    eventType: string,
    metadata?: Record<any, any>,
    options?: {
      throttleMs?: number;
      dedupeKey?: string;
      subView?: string;
      domain?: "storefront" | "admin" | "checkout";
      page?: string;
    }
  ) => {
    const activePage = options?.page || pathname || undefined;
    const activeDomain = options?.domain || (activePage?.startsWith("/admin") ? "admin" : defaultDomain);
    const eventKey =
      options?.dedupeKey ||
      `${eventType}|${activePage || ""}|${options?.subView || ""}|${toStableString(metadata || {})}`;
    const throttleMs = options?.throttleMs ?? 0;
    if (shouldThrottle(eventKey, throttleMs)) {
      return;
    }

    emitEvent({
      eventType,
      userId: currentUserId,
      sessionId: getSessionId(),
      page: activePage,
      subView: options?.subView,
      domain: activeDomain,
      metadata: {
        ...metadata,
        userRole,
      },
    });
  }, [emitEvent, pathname, currentUserId, userRole, defaultDomain, shouldThrottle, toStableString]);

  const trackProductView = useCallback((productId: string, productName: string) => {
    trackEvent(
      EventType.PRODUCT_VIEW,
      { productId, productName },
      { throttleMs: 1500, dedupeKey: `${EventType.PRODUCT_VIEW}:${productId}`, domain: "storefront" }
    );
  }, [trackEvent]);

  const trackAddToCart = useCallback((productId: string, quantity: number) => {
    trackEvent(
      EventType.ADD_TO_CART,
      { productId, quantity },
      { throttleMs: 1000, dedupeKey: `${EventType.ADD_TO_CART}:${productId}`, domain: "storefront" }
    );
  }, [trackEvent]);

  const trackRemoveFromCart = useCallback((productId: string) => {
    trackEvent(
      EventType.REMOVE_FROM_CART,
      { productId },
      { throttleMs: 1000, dedupeKey: `${EventType.REMOVE_FROM_CART}:${productId}`, domain: "storefront" }
    );
  }, [trackEvent]);

  const trackCheckout = useCallback((step: "start" | "complete", orderValue?: number) => {
    trackEvent(
      step === "start" ? EventType.CHECKOUT_START : EventType.CHECKOUT_COMPLETE,
      { orderValue },
      { throttleMs: 2000, dedupeKey: `checkout:${step}`, domain: "checkout" }
    );
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent(EventType.SEARCH, { query, resultsCount }, { domain: "storefront" });
  }, [trackEvent]);

  // In-page non-URL event tracking helpers

  const trackTabView = useCallback((tabName: string, options?: { parentPage?: string; domain?: "admin" | "storefront" }) => {
    const domain = options?.domain || (pathname?.startsWith("/admin") ? "admin" : "storefront");
    const eventType = domain === "admin" ? EventType.ADMIN_TAB_VIEW : EventType.TAB_VIEW;
    trackEvent(
      eventType,
      { tab: tabName },
      {
        subView: tabName,
        page: options?.parentPage || pathname || undefined,
        domain,
        throttleMs: 300,
        dedupeKey: `tab:${pathname}:${tabName}`,
      }
    );
  }, [trackEvent, pathname]);

  const trackModal = useCallback((modalName: string, action: "open" | "close", metadata?: Record<string, any>) => {
    const eventType = action === "open" ? EventType.MODAL_OPEN : EventType.MODAL_CLOSE;
    trackEvent(
      eventType,
      { modalName, action, ...metadata },
      { throttleMs: 300, dedupeKey: `modal:${modalName}:${action}` }
    );
  }, [trackEvent]);

  const trackAdminAction = useCallback((action: string, targetId?: string, metadata?: Record<string, any>) => {
    trackEvent(
      EventType.ADMIN_ACTION,
      { action, targetId, ...metadata },
      { domain: "admin", throttleMs: 200 }
    );
  }, [trackEvent]);

  const trackFilter = useCallback((filterType: string, filterValue: any, metadata?: Record<string, any>) => {
    trackEvent(
      EventType.FILTER_APPLIED,
      { filterType, filterValue, ...metadata },
      { throttleMs: 500 }
    );
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName: string, success: boolean, metadata?: Record<string, any>) => {
    trackEvent(
      EventType.FORM_SUBMIT,
      { formName, success, ...metadata },
      { throttleMs: 500 }
    );
  }, [trackEvent]);

  const trackUIInteraction = useCallback((element: string, action: string, metadata?: Record<string, any>) => {
    trackEvent(
      EventType.UI_INTERACTION,
      { element, action, ...metadata },
      { throttleMs: 300 }
    );
  }, [trackEvent]);

  return {
    trackEvent,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckout,
    trackSearch,
    trackTabView,
    trackModal,
    trackAdminAction,
    trackFilter,
    trackFormSubmit,
    trackUIInteraction,
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
