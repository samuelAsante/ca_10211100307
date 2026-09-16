"use client";

import { useMemo, useState } from "react";
import { LiveEventFeed } from "@/components/analytics/live-event-feed";
import { InsightsTimeline } from "@/components/analytics/insights-timeline";
import {
  useInsightsTimeline,
  useAdminMetrics,
  useAdminBatches,
  useAdminJobs,
  useTriggerBatchAnalysis,
} from "@/hooks/use-analytics-insights";
import { useProducts } from "@/hooks/use-products";
import { useOrders } from "@/hooks/use-orders";
import { MetricsDashboard } from "@/components/admin/analytics/MetricsDashboard";
import { BatchList } from "@/components/admin/analytics/BatchList";
import { JobMonitor } from "@/components/admin/analytics/JobMonitor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

type Product = {
  id: string;
  stock: number;
  discount?: number;
};

type Order = {
  id: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED";
  totalAmount: number;
  createdAt: string;
};

export default function AnalyticsDashboard() {
  const { trackTabView } = useAnalytics();

  // TanStack Query for AI Insights in the page
  const [insightsPage, setInsightsPage] = useState<number>(1);
  const [insightsLimit, setInsightsLimit] = useState<number>(10);

  const {
    data: insightsData,
    isLoading: isInsightsLoading,
    isFetching: isInsightsFetching,
    error: insightsError,
    refetch: refetchInsights,
  } = useInsightsTimeline({ page: insightsPage, limit: insightsLimit });

  const {
    data: metricsData,
    isLoading: isMetricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useAdminMetrics();

  const {
    data: batchesData = [],
    isLoading: isBatchesLoading,
    error: batchesError,
  } = useAdminBatches();

  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useAdminJobs();

  const triggerBatchMutation = useTriggerBatchAnalysis();

  const handleTriggerAnalysis = async (batchId: string) => {
    await triggerBatchMutation.mutateAsync(batchId);
  };

  const { data: products = [], isLoading: loadingProducts, error: productsError } = useProducts();
  const { data: orders = [], isLoading: loadingOrders, error: ordersError } = useOrders();

  const loadingCommerce = loadingProducts || loadingOrders;
  const commerceError = productsError
    ? (productsError as Error).message
    : ordersError
    ? (ordersError as Error).message
    : null;

  const commerce = useMemo(() => {
    const discountProducts = products.filter((product) => (Number(product.discount) || 0) > 0);
    const lowStockProducts = products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 10);
    const outOfStockProducts = products.filter((product) => Number(product.stock) === 0);
    const paidRevenue = orders
      .filter((order) => order.status === "PAID" || order.status === "FULFILLED")
      .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
    const pendingOrders = orders.filter((order) => order.status === "PENDING").length;

    return {
      totalProducts: products.length,
      discountedProducts: discountProducts.length,
      discountCoverage:
        products.length > 0 ? Math.round((discountProducts.length / products.length) * 100) : 0,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,
      totalOrders: orders.length,
      pendingOrders,
      paidRevenue,
    };
  }, [products, orders]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Production-grade real-time analytics with AI-driven insights
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {loadingCommerce ? "..." : commerce.totalOrders}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pending: {loadingCommerce ? "..." : commerce.pendingOrders}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Paid Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              GH₵{loadingCommerce ? "..." : commerce.paidRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PAID + FULFILLED orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Discount Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {loadingCommerce ? "..." : `${commerce.discountCoverage}%`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {loadingCommerce ? "..." : `${commerce.discountedProducts}/${commerce.totalProducts}`} products discounted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Stock Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {loadingCommerce ? "..." : commerce.lowStockProducts + commerce.outOfStockProducts}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Low: {loadingCommerce ? "..." : commerce.lowStockProducts} • Out:{" "}
              {loadingCommerce ? "..." : commerce.outOfStockProducts}
            </p>
          </CardContent>
        </Card>
      </div>

      {commerceError && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {commerceError}
          </CardContent>
        </Card>
      )}

      <Tabs
        defaultValue="overview"
        className="space-y-6"
        onValueChange={(tab) => trackTabView(tab, { parentPage: "/admin/analytics", domain: "admin" })}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <MetricsDashboard
            metrics={metricsData}
            loading={isMetricsLoading}
            error={metricsError ? (metricsError as Error).message : null}
            onRefresh={() => refetchMetrics()}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveEventFeed />
            <InsightsTimeline
              insights={insightsData?.insights}
              pagination={insightsData?.pagination}
              isLoading={isInsightsLoading}
              isRefreshing={isInsightsFetching}
              error={insightsError ? (insightsError as Error).message : null}
              page={insightsPage}
              limit={insightsLimit}
              onPageChange={setInsightsPage}
              onLimitChange={(newLimit) => {
                setInsightsLimit(newLimit);
                setInsightsPage(1);
              }}
              onRefresh={() => refetchInsights()}
            />
          </div>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches">
          <BatchList
            batches={batchesData}
            loading={isBatchesLoading}
            error={batchesError ? (batchesError as Error).message : null}
            onTriggerAnalysis={handleTriggerAnalysis}
            triggeringId={triggerBatchMutation.isPending ? (triggerBatchMutation.variables as string) : null}
          />
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <JobMonitor
            jobs={jobsData?.jobs}
            deadLetterJobs={jobsData?.deadLetterJobs}
            loading={isJobsLoading}
            error={jobsError ? (jobsError as Error).message : null}
            onRefresh={() => refetchJobs()}
          />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <InsightsTimeline
            insights={insightsData?.insights}
            pagination={insightsData?.pagination}
            isLoading={isInsightsLoading}
            isRefreshing={isInsightsFetching}
            error={insightsError ? (insightsError as Error).message : null}
            page={insightsPage}
            limit={insightsLimit}
            onPageChange={setInsightsPage}
            onLimitChange={(newLimit) => {
              setInsightsLimit(newLimit);
              setInsightsPage(1);
            }}
            onRefresh={() => refetchInsights()}
          />
        </TabsContent>
      </Tabs>

      {/* Help section */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Commerce Health:</strong> Track discount coverage, paid revenue,
              stock risk, and pending orders in one place.
            </p>
            <p>
              <strong>Pipeline Reliability:</strong> Monitor circuit breaker state,
              failed jobs, dead-letter queue, and batch processing age.
            </p>
            <p>
              <strong>Operational Cadence:</strong> Commerce snapshot refreshes every
              30s while pipeline metrics refresh every 10s.
            </p>
            <Badge variant="outline" className="mt-2">Tip: Keep Pending Orders low and discount coverage intentional.</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
