/**
 * Unified Shared Types and API Contracts
 * Single source of truth for all domain entities, API envelopes, and hook contracts.
 */

// ============================================================================
// 1. API Envelopes & Pagination
// ============================================================================

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean;
  hasPrev?: boolean;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

// ============================================================================
// 2. Product Contracts
// ============================================================================

export interface Product {
  id: string;
  name: string;
  title?: string;
  description?: string;
  price: number;
  discount?: number;
  rating?: number | null;
  ratingFromManufacturer?: number | null;
  stock?: number;
  slug: string;
  sku?: string;
  category?: string;
  subcategories?: string[];
  images?: string[];
  colors?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductQueryParams {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  discount?: number;
  stock?: number;
  category?: string;
  subcategories?: string[];
  images?: string[];
  colors?: string[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id?: string;
  slug?: string;
}

export interface ProductCardProps {
  id: string;
  mainImage?: string;
  images?: string[];
  name: string;
  title?: string;
  description: string;
  rating?: number | null;
  reviewCount?: number;
  price: number;
  oldPrice?: number;
  badge?: string;
  badgeColor?: string;
  link?: string;
  classNames?: string;
  slug: string;
  colors?: string[];
  discount?: number;
}

export interface HeroCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  slug: string;
  discount: number;
}

export interface ShopCardProps {
  imageUrl: string;
  title: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartState {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

// ============================================================================
// 3. Analytics & Insights Contracts
// ============================================================================

export * from "@/interface/analytics";

export interface InsightsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  domain?: string;
}

export interface AdminMetrics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  recentOrders?: any[];
  chartData?: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface MetricsData {
  jobs: {
    pending: number;
    running: number;
    success_last_hour: number;
    failed_last_hour: number;
    oldest_pending_age_seconds: number | null;
  };
  batches: {
    open: number;
    sealed: number;
    analyzed: number;
    oldest_open_age_seconds: number | null;
  };
  performance: {
    avg_analysis_time_ms: number | null;
    p95_analysis_time_ms: number | null;
    avg_batch_size: number | null;
  };
  circuit_breaker: {
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    failure_count: number;
    last_state_change: string | null;
  };
  dead_letter_queue: {
    total: number;
    last_24_hours: number;
  };
}

export interface AnalyticsBatch {
  batch_id: string;
  status: string;
  event_count: number;
  created_at: string;
  sealed_at: string | null;
  analysis_job?: {
    job_id: string;
    status: string;
    attempt_count: number;
    last_error: string | null;
  };
}

export interface AnalyticsJob {
  job_id: string;
  batch_id: string;
  status: string;
  attempt_count: number;
  created_at: string;
  updated_at: string;
  last_error: string | null;
  error_context: any;
  analysis_time_ms: number | null;
}

export interface DeadLetterJob {
  dlq_id: string;
  job_id: string;
  batch_id: string;
  attempt_count: number;
  last_error: string;
  error_context: any;
  failed_at: string;
}


// ============================================================================
// 4. Diagnostics & Service Health Contracts
// ============================================================================

export interface ServiceOverview {
  timestamp: string;
  services: {
    paystack: {
      configured: boolean;
      mode: "test" | "live" | "unconfigured";
      maskedKey: string;
      currency: string;
      supportedChannels: string[];
    };
    email: {
      configured: boolean;
      provider: string;
      maskedKey: string;
      sender: string;
    };
    ai: {
      configured: boolean;
      provider: string;
      maskedKey: string;
      model: string;
      circuitBreaker: {
        state: string;
        failures: number;
        lastChange: string | null;
      };
    };
    database: {
      configured: boolean;
      provider: string;
      status: string;
      latencyMs: number;
      counts: {
        products: number;
        orders: number;
        users: number;
        batches: number;
        events: number;
      };
    };
    cloudinary: {
      configured: boolean;
      cloudName: string;
      apiKey: string;
    };
  };
  system: {
    nodeEnv: string;
    uptimeSeconds: number;
    memoryUsageMb: number;
  };
}

export interface ServiceProbeResult {
  running: boolean;
  status?: "success" | "error";
  latencyMs?: number;
  data?: any;
  error?: string;
  timestamp?: string;
}

export interface RunProbeVariables {
  serviceKey: string;
  endpoint: string;
  body?: Record<string, any>;
}

// ============================================================================
// 5. Orders Contracts
// ============================================================================

export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED";

export interface OrderItem {
  id?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  status: OrderStatus;
  totalAmount: number;
  items: any;
  paymentRef?: string | null;
  paymentProvider?: string | null;
  idempotencyKey?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

// ============================================================================
// 6. Coupons & Promotions Contracts
// ============================================================================

export interface ValidateCouponPayload {
  code: string;
  subtotal: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  originalSubtotal: number;
  newTotal: number;
  message?: string;
}

export interface ActiveCoupon {
  id?: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number | null;
  expiresAt?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number | null;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCouponInput {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minSubtotal?: number;
  maxDiscount?: number | null;
  maxUses?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {
  id?: string;
}

// ============================================================================
// 7. Order Tracking Contracts
// ============================================================================

export interface TrackingTimelineStep {
  step: "ORDER_PLACED" | "PAYMENT_CONFIRMED" | "PROCESSING" | "FULFILLED";
  title: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
  current: boolean;
}

export interface TrackOrderResponse {
  id: string;
  customerName: string;
  maskedPhone: string;
  maskedEmail: string;
  address: string;
  status: OrderStatus;
  totalAmount: number;
  items: any[];
  paymentRef?: string | null;
  paymentProvider?: string | null;
  paidAt?: string | null;
  createdAt: string;
  timeline: TrackingTimelineStep[];
}

// ============================================================================
// 8. Low Stock & Inventory Contracts
// ============================================================================

export interface LowStockResponse {
  threshold: number;
  count: number;
  products: Product[];
}

// ============================================================================
// 9. Business Settings Contracts
// ============================================================================

export interface BusinessSettings {
  id?: string;
  name: string;
  logoUrl?: string | null;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateBusinessSettingsInput = Partial<Omit<BusinessSettings, "id" | "createdAt" | "updatedAt">>;

// ============================================================================
// 10. Reviews Contracts
// ============================================================================

export interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  productSlug: string;
  createdAt: string;
}

export interface CreateReviewInput {
  customerName: string;
  review: string;
  rating: number;
  productSlug: string;
}

// ============================================================================
// 11. Checkout & Payment Contracts
// ============================================================================

export interface ShippingFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

export interface PaymentState {
  paymentRef: string;
  orderId: string;
  status: "INITIATED" | "PROCESSING" | "SUCCESS" | "FAILED";
  failureReason?: string;
}

export interface CheckoutPayload {
  items?: Array<{
    id: string;
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  cartItems?: Array<{
    id: string;
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  shipping?: ShippingFormData;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  totalAmount?: number;
  total?: number;
  callbackUrl?: string;
  couponCode?: string;
}

export interface CheckoutResponse {
  orderId: string;
  paymentRef: string;
  authorizationUrl?: string;
  accessCode?: string;
  amount: number;
  currency: string;
}

export interface PaymentStatusResponse {
  status: "INITIATED" | "PROCESSING" | "SUCCESS" | "FAILED";
  orderId: string;
  paymentRef: string;
  failureReason?: string;
  order?: any;
  amount?: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  paidAt?: string | null;
  createdAt?: string;
}


