/**
 * Real-time Analytics Event Model
 * Shared contract between frontend and backend
 */

export interface UserEvent {
  eventId: string;
  eventType: string;
  userId: string;
  sessionId: string;
  page?: string;
  subView?: string;
  domain?: "storefront" | "admin" | "checkout";
  metadata?: Record<string, any>;
  timestamp: string; // ISO string
}

/**
 * Common event types
 */
export enum EventType {
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  PAGE_VIEW = "PAGE_VIEW",
  PRODUCT_VIEW = "PRODUCT_VIEW",
  ADD_TO_CART = "ADD_TO_CART",
  REMOVE_FROM_CART = "REMOVE_FROM_CART",
  CHECKOUT_START = "CHECKOUT_START",
  CHECKOUT_COMPLETE = "CHECKOUT_COMPLETE",
  SEARCH = "SEARCH",
  SCROLL = "SCROLL",
  FILTER_APPLIED = "FILTER_APPLIED",

  // In-page and virtual view event types
  TAB_VIEW = "TAB_VIEW",
  ADMIN_TAB_VIEW = "ADMIN_TAB_VIEW",
  MODAL_OPEN = "MODAL_OPEN",
  MODAL_CLOSE = "MODAL_CLOSE",
  DRAWER_TOGGLE = "DRAWER_TOGGLE",
  ADMIN_ACTION = "ADMIN_ACTION",
  FORM_SUBMIT = "FORM_SUBMIT",
  UI_INTERACTION = "UI_INTERACTION",
}

/**
 * AI-generated insight model
 */
export interface Insight {
  id: string;
  summary: string;
  confidence: number;
  patterns: string[];
  timeWindow: string;
  eventCount: number;
  createdAt: string;
}

export interface InsightsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  offset: number;
  hasMore: boolean;
  hasPrev: boolean;
}

export interface InsightsResponse {
  insights: Insight[];
  pagination: InsightsPagination;
}

/**
 * Batch of events sent to AI
 */
export interface EventBatch {
  timeWindow: string;
  events: UserEvent[];
  batchId: string;
}

/**
 * AI analysis response
 */
export interface AIAnalysis {
  summary: string;
  confidence: number;
  patterns: string[];
  timestamp: string;
}
