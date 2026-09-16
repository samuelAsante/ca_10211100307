"use client";

import { getBackendUrl } from "@/lib/backend-url";
import { authHeaders } from "@/lib/auth-token";
import { useCallback, useEffect, useState } from "react";
import { Insight, InsightsPagination } from "@/interface/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  Calendar,
  Layers,
  AlertCircle,
} from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

export function InsightsTimeline() {
  const { trackUIInteraction } = useAnalytics();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [pagination, setPagination] = useState<InsightsPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    offset: 0,
    hasMore: false,
    hasPrev: false,
  });
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(
    async (targetPage = page, targetLimit = limit, showRefreshIndicator = false) => {
      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const backendUrl = getBackendUrl();
        const res = await fetch(
          `${backendUrl}/api/insights?page=${targetPage}&limit=${targetLimit}`,
          {
            credentials: "include",
            headers: authHeaders(),
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to load insights (HTTP ${res.status})`);
        }

        const data = await res.json();
        setInsights(data.insights || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err: any) {
        console.error("Error fetching insights:", err);
        setError(err.message || "Failed to fetch AI insights");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchInsights(page, limit);
  }, [fetchInsights, page, limit]);

  // Auto-refresh every 30s for the active page
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInsights(page, limit, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchInsights, page, limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (pagination?.totalPages || 1) || newPage === page) {
      return;
    }
    setPage(newPage);
    trackUIInteraction("insights_pagination", "page_change", {
      fromPage: page,
      toPage: newPage,
      limit,
      domain: "admin",
    });
  };

  const handleLimitChange = (newLimitStr: string) => {
    const newLimit = parseInt(newLimitStr, 10);
    setLimit(newLimit);
    setPage(1);
    trackUIInteraction("insights_pagination", "limit_change", {
      limit: newLimit,
      domain: "admin",
    });
  };

  const getConfidenceBadge = (confidence: number) => {
    const pct = Math.round(confidence * 100);
    if (confidence >= 0.8) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">
          {pct}% Confidence
        </Badge>
      );
    }
    if (confidence >= 0.6) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30">
          {pct}% Confidence
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/30">
        {pct}% Confidence
      </Badge>
    );
  };

  // Generate pagination buttons array
  const getPageNumbers = () => {
    const totalPages = pagination?.totalPages || 1;
    const current = page;
    const delta = 1; // pages around current
    const range: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }

    return range;
  };

  const fromCount = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const toCount = Math.min(page * limit, pagination.total);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg font-semibold">AI Insights Timeline</CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              {pagination.total} Total
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            Automated behavioral patterns and recommendations synthesized from batch telemetry
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {/* Per Page Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Show:</span>
            <Select value={String(limit)} onValueChange={handleLimitChange}>
              <SelectTrigger className="h-8 w-[72px] text-xs">
                <SelectValue placeholder={String(limit)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInsights(page, limit, true)}
            disabled={loading || isRefreshing}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing || loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !isRefreshing ? (
          <div className="space-y-3 py-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 space-y-3 animate-pulse bg-muted/20"
              >
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded w-20" />
                  <div className="h-5 bg-muted rounded w-24" />
                </div>
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="p-3 rounded-full bg-muted/60 text-muted-foreground inline-block">
              <Activity className="h-6 w-6" />
            </div>
            <p className="font-medium text-sm">No insights available</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Event batches are automatically analyzed when sealed. Trigger manual analysis in the Batches tab or wait for shopping journeys to complete.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="border rounded-lg p-4 space-y-3 bg-card hover:bg-muted/10 transition-colors shadow-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {insight.summary}
                  </p>
                  <div className="shrink-0">{getConfidenceBadge(insight.confidence)}</div>
                </div>

                {insight.patterns && insight.patterns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {insight.patterns.map((pattern, idx) => (
                      <Badge
                        key={`${insight.id}-pattern-${idx}`}
                        variant="outline"
                        className="text-[11px] font-normal py-0.5 px-2 bg-background/50 border-muted-foreground/20 text-muted-foreground"
                      >
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {insight.eventCount} events analyzed
                    </span>
                    {insight.timeWindow && (
                      <span className="hidden sm:flex items-center gap-1 font-mono">
                        <Activity className="h-3 w-3" />
                        {insight.timeWindow}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(insight.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer Controls */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{fromCount}</span> to{" "}
              <span className="font-medium text-foreground">{toCount}</span> of{" "}
              <span className="font-medium text-foreground">{pagination.total}</span> insights
            </p>

            <div className="flex items-center gap-1 self-center sm:self-auto">
              {/* First Page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(1)}
                disabled={page <= 1 || loading}
                title="First Page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>

              {/* Previous Page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading}
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((num, idx) =>
                  num === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-xs text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={`page-${num}`}
                      variant={page === num ? "default" : "outline"}
                      size="sm"
                      className="h-8 min-w-[32px] px-2 text-xs font-mono"
                      onClick={() => handlePageChange(Number(num))}
                      disabled={loading}
                    >
                      {num}
                    </Button>
                  )
                )}
              </div>

              {/* Next Page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.totalPages || loading}
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              {/* Last Page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={page >= pagination.totalPages || loading}
                title="Last Page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
