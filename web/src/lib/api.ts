import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getBackendUrl } from "@/lib/backend-url";
import { getStoredToken } from "@/lib/auth-token";

/**
 * Central Axios API Client
 * Configured with baseURL, authentication interceptors, and typed helpers.
 */
export const api: AxiosInstance = axios.create({
  baseURL: getBackendUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: dynamically inject bearer token from client storage
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected network error occurred";
    return Promise.reject(new Error(message));
  }
);

// Domain-scoped API helpers
export const productsApi = {
  getAll: <T = any>(params?: Record<string, any>) =>
    api.get<T>("/api/products", { params }),
  getBySlug: <T = any>(slug: string) =>
    api.get<T>(`/api/products/${encodeURIComponent(slug)}`),
  create: <T = any>(payload: any) =>
    api.post<T>("/api/products", payload),
  update: <T = any>(slug: string, payload: any) =>
    api.put<T>(`/api/products/${encodeURIComponent(slug)}`, payload),
  delete: <T = any>(id: string) =>
    api.delete<T>("/api/products", { data: { id } }),
};

export const analyticsApi = {
  getInsights: <T = any>(params?: Record<string, any>) =>
    api.get<T>("/api/insights", { params }),
  getMetrics: <T = any>(params?: Record<string, any>) =>
    api.get<T>("/api/admin/metrics", { params }),
  getStats: <T = any>() =>
    api.get<T>("/api/analytics/stats"),
  getBatches: <T = any>() =>
    api.get<T>("/api/admin/batches"),
  getJobs: <T = any>() =>
    api.get<T>("/api/admin/jobs"),
  triggerBatchAnalysis: <T = any>(batchId: string) =>
    api.post<T>(`/api/admin/batches/${encodeURIComponent(batchId)}/analyze`),
};

export const diagnosticsApi = {
  getOverview: <T = any>() =>
    api.get<T>("/api/admin/diagnostics/overview"),
  testPaystack: <T = any>() =>
    api.post<T>("/api/admin/diagnostics/paystack"),
  testEmail: <T = any>(body?: { toEmail?: string }) =>
    api.post<T>("/api/admin/diagnostics/email", body),
  testAI: <T = any>() =>
    api.post<T>("/api/admin/diagnostics/ai"),
  testDatabase: <T = any>() =>
    api.post<T>("/api/admin/diagnostics/database"),
  testCloudinary: <T = any>() =>
    api.post<T>("/api/admin/diagnostics/cloudinary"),
  runProbe: <T = any>(serviceKey: string, body?: Record<string, any>) =>
    api.post<T>(`/api/admin/diagnostics/${encodeURIComponent(serviceKey)}`, body),
};

export const ordersApi = {
  list: <T = any>(params?: Record<string, any>) =>
    api.get<T>("/api/orders", { params }),
  getStatus: <T = any>(orderId: string) =>
    api.get<T>(`/api/orders/${encodeURIComponent(orderId)}/status`),
  fulfill: <T = any>(orderId: string) =>
    api.post<T>(`/api/orders/${encodeURIComponent(orderId)}/fulfill`),
  cancel: <T = any>(orderId: string) =>
    api.post<T>(`/api/orders/${encodeURIComponent(orderId)}/cancel`),
};
