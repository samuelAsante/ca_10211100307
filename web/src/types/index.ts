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
