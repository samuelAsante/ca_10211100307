"use client";

import { Insight, InsightsPagination } from "@/types";
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

export interface InsightsTimelineProps {
  insights?: Insight[];
  pagination?: InsightsPagination;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onRefresh?: () => void;
}

export function InsightsTimeline({
  insights = [],
  pagination = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    offset: 0,
    hasMore: false,
    hasPrev: false,
  },
  isLoading = false,
  isRefreshing = false,
  error = null,
  page = 1,
  limit = 10,
  onPageChange,
  onLimitChange,
  onRefresh,
}: InsightsTimelineProps) {
  const { trackUIInteraction } = useAnalytics();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (pagination?.totalPages || 1) || newPage === page) {
      return;
    }
    onPageChange?.(newPage);
    trackUIInteraction("insights_pagination", "page_change", {
      fromPage: page,
      toPage: newPage,
      limit,
      domain: "admin",
    });
  };

  const handleLimitChange = (newLimitStr: string) => {
    const newLimit = parseInt(newLimitStr, 10);
    onLimitChange?.(newLimit);
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
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>AI Insights Timeline</span>
            <Badge variant="outline" className="text-xs font-normal">
              Page {page} of {pagination.totalPages || 1}
            </Badge>
          </CardTitle>
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
            onClick={() => onRefresh?.()}
            disabled={isLoading || isRefreshing}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing || isLoading ? "animate-spin" : ""}`}
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

        {isLoading ? (
          <div className="space-y-4 py-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-lg bg-muted/40 animate-pulse border"
              />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed rounded-lg">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">
              No insights generated yet
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm mx-auto">
              Insights will automatically appear as background telemetry batches are processed and analyzed by AI.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-primary/20 ml-3 pl-6 space-y-6 py-2">
            {insights.map((insight) => (
              <div key={insight.id} className="relative group">
                {/* Node icon on the timeline line */}
                <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>

                <div className="p-4 rounded-lg border bg-card/60 hover:bg-card hover:border-primary/40 transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getConfidenceBadge(insight.confidence)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {insight.eventCount} events analyzed
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <time dateTime={insight.createdAt}>
                        {new Date(insight.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                  </div>

                  {/* Summary / Core Finding */}
                  <p className="text-sm font-medium leading-relaxed text-foreground/90">
                    {insight.summary}
                  </p>

                  {/* Patterns / Tags */}
                  {insight.patterns && insight.patterns.length > 0 && (
                    <div className="pt-2 border-t flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] font-medium text-muted-foreground mr-1 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Patterns:
                      </span>
                      {insight.patterns.map((pattern, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-secondary/80 text-secondary-foreground font-normal border"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Pagination Bar */}
        {!isLoading && pagination.total > 0 && (
          <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{fromCount}</span> to{" "}
              <span className="font-semibold text-foreground">{toCount}</span> of{" "}
              <span className="font-semibold text-foreground">{pagination.total}</span> insights
            </div>

            <div className="flex items-center gap-1">
              {/* First Page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(1)}
                disabled={page <= 1 || isLoading}
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              {/* Prev Page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(page - 1)}
                disabled={!pagination.hasPrev || isLoading}
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((p, idx) =>
                  typeof p === "number" ? (
                    <Button
                      key={idx}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className="h-8 min-w-8 px-2 text-xs"
                      onClick={() => handlePageChange(p)}
                      disabled={isLoading}
                    >
                      {p}
                    </Button>
                  ) : (
                    <span key={idx} className="px-1 text-muted-foreground">
                      ...
                    </span>
                  )
                )}
              </div>

              {/* Next Page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasMore || isLoading}
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Last Page */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={page >= pagination.totalPages || isLoading}
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
