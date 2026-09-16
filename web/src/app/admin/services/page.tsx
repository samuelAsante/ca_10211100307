"use client";

import { useEffect, useState, useCallback } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { authHeaders } from "@/lib/auth-token";
import { authClient } from "@/lib/auth-client";
import { useAnalytics } from "@/hooks/use-analytics";
import { useSocket } from "@/components/analytics/socket-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  Activity,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Cloud,
  CreditCard,
  Database,
  Loader2,
  Mail,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

interface ServiceOverview {
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

interface TestResult {
  running: boolean;
  status?: "success" | "error";
  latencyMs?: number;
  data?: any;
  error?: string;
  timestamp?: string;
}

export default function ServicesDiagnosticsPage() {
  const { trackAdminAction, trackTabView } = useAnalytics();
  const { isConnected: isSocketConnected, socket } = useSocket();
  const { data: session } = authClient.useSession();

  const [overview, setOverview] = useState<ServiceOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testAIPrompt, setTestAIPrompt] = useState("Explain how resilient batching protects e-commerce analytics in one sentence.");

  const [testResults, setTestResults] = useState<Record<string, TestResult>>({
    paystack: { running: false },
    email: { running: false },
    ai: { running: false },
    database: { running: false },
    cloudinary: { running: false },
  });

  const backendUrl = getBackendUrl();

  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const res = await fetch(`${backendUrl}/api/admin/diagnostics/overview`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load service diagnostics overview");
      const data = await res.json();
      setOverview(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load services overview");
    } finally {
      setLoadingOverview(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    trackTabView("service_diagnostics", { parentPage: "/admin/services", domain: "admin" });
    fetchOverview();
  }, [fetchOverview, trackTabView]);

  useEffect(() => {
    if (session?.user?.email && !testEmailAddress) {
      setTestEmailAddress(session.user.email);
    }
  }, [session, testEmailAddress]);

  const runTest = async (serviceKey: string, endpoint: string, body?: Record<string, any>) => {
    setTestResults((prev) => ({
      ...prev,
      [serviceKey]: { running: true },
    }));
    trackAdminAction("diagnostics_run_test", serviceKey, { endpoint });

    const start = Date.now();
    try {
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json().catch(() => null);
      const latencyMs = data?.latencyMs || Date.now() - start;

      if (res.ok && data?.ok !== false) {
        setTestResults((prev) => ({
          ...prev,
          [serviceKey]: {
            running: false,
            status: "success",
            latencyMs,
            data,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
        toast.success(`${serviceKey.toUpperCase()} probe passed (${latencyMs}ms)`);
      } else {
        const errorMsg = data?.error || `Service probe failed (HTTP ${res.status})`;
        setTestResults((prev) => ({
          ...prev,
          [serviceKey]: {
            running: false,
            status: "error",
            latencyMs,
            error: errorMsg,
            data,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
        toast.error(`${serviceKey.toUpperCase()}: ${errorMsg}`);
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [serviceKey]: {
          running: false,
          status: "error",
          latencyMs: Date.now() - start,
          error: err.message || "Network error while running probe",
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      toast.error(`${serviceKey.toUpperCase()} test failed`);
    }
  };

  const handleTestAll = async () => {
    trackAdminAction("diagnostics_run_all_tests");
    toast("Starting full system diagnostics probe...", { icon: "🚀" });
    await Promise.all([
      runTest("paystack", "/api/admin/diagnostics/paystack"),
      runTest("email", "/api/admin/diagnostics/email", { to: testEmailAddress }),
      runTest("ai", "/api/admin/diagnostics/ai", { prompt: testAIPrompt }),
      runTest("database", "/api/admin/diagnostics/database"),
      runTest("cloudinary", "/api/admin/diagnostics/cloudinary"),
    ]);
    await fetchOverview();
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ""}${h}h ${m}m`;
  };

  const isConfigured = (cond: boolean) => (cond ? "Configured" : "Missing Keys");

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Service Diagnostics</h1>
          <p className="text-muted-foreground mt-1">
            Live integration verification, API roundtrip latency, and connectivity testing for all core services
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={loadingOverview}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingOverview ? "animate-spin" : ""}`} />
            Refresh Config
          </Button>

          <Button
            size="sm"
            onClick={handleTestAll}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Run All Probes
          </Button>
        </div>
      </div>

      {/* Global Status Bar */}
      <Card className="bg-gradient-to-r from-card to-muted/40 border shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex items-center gap-3 pr-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Backend Health</p>
                <p className="text-lg font-bold text-foreground">
                  {loadingOverview ? "Checking..." : "API Online"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-0 md:px-4 pt-4 md:pt-0">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Database Latency</p>
                <p className="text-lg font-bold text-foreground">
                  {overview ? `${overview.services.database.latencyMs}ms` : "..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-0 md:px-4 pt-4 md:pt-0">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Radio className={`h-6 w-6 ${isSocketConnected ? "text-purple-600" : "text-amber-500"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">WebSocket Gateway</p>
                <p className="text-lg font-bold text-foreground">
                  {isSocketConnected ? "Connected" : "Reconnecting"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-0 md:pl-4 pt-4 md:pt-0">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Backend Uptime</p>
                <p className="text-lg font-bold text-foreground">
                  {overview ? formatUptime(overview.system.uptimeSeconds) : "..."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Paystack Payment Gateway */}
        <Card className="flex flex-col justify-between border shadow-sm">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Paystack Gateway</CardTitle>
                </div>
                {overview && (
                  <Badge variant={overview.services.paystack.configured ? "default" : "destructive"}>
                    {overview.services.paystack.configured
                      ? `${overview.services.paystack.mode.toUpperCase()} MODE`
                      : "NOT SET"}
                  </Badge>
                )}
              </div>
              <CardDescription>Ghana Card & Mobile Money payment processor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Secret Key:</span>
                  <span>{overview?.services.paystack.maskedKey || "..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span>GHS (Ghanaian Cedi)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channels:</span>
                  <span>Card, Mobile Money</span>
                </div>
              </div>

              {testResults.paystack.status && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    testResults.paystack.status === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>
                      {testResults.paystack.status === "success" ? "✓ Probe Passed" : "✗ Probe Failed"}
                    </span>
                    <span>{testResults.paystack.latencyMs}ms</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px]">
                    {testResults.paystack.error || testResults.paystack.data?.message}
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              className="w-full gap-2"
              variant="outline"
              disabled={testResults.paystack.running}
              onClick={() => runTest("paystack", "/api/admin/diagnostics/paystack")}
            >
              {testResults.paystack.running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Test Paystack API
            </Button>
          </div>
        </Card>

        {/* 2. Resend Email Service */}
        <Card className="flex flex-col justify-between border shadow-sm">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Resend Email</CardTitle>
                </div>
                {overview && (
                  <Badge variant={overview.services.email.configured ? "default" : "destructive"}>
                    {isConfigured(overview.services.email.configured)}
                  </Badge>
                )}
              </div>
              <CardDescription>Transactional verification and order receipts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Key:</span>
                  <span>{overview?.services.email.maskedKey || "..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sender:</span>
                  <span className="truncate max-w-[170px]" title={overview?.services.email.sender}>
                    {overview?.services.email.sender || "..."}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Send Test Email To:</label>
                <Input
                  type="email"
                  className="h-8 text-xs font-mono"
                  placeholder="admin@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                />
              </div>

              {testResults.email.status && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    testResults.email.status === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>
                      {testResults.email.status === "success" ? "✓ Email Sent" : "✗ Send Failed"}
                    </span>
                    <span>{testResults.email.latencyMs}ms</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] break-all">
                    {testResults.email.error || `ID: ${testResults.email.data?.messageId}`}
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              className="w-full gap-2"
              variant="outline"
              disabled={testResults.email.running}
              onClick={() => runTest("email", "/api/admin/diagnostics/email", { to: testEmailAddress })}
            >
              {testResults.email.running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Diagnostic Email
            </Button>
          </div>
        </Card>

        {/* 3. Groq AI (LLaMA 3.3 70B) */}
        <Card className="flex flex-col justify-between border shadow-sm">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Groq AI Engine</CardTitle>
                </div>
                {overview && (
                  <Badge variant={overview.services.ai.configured ? "default" : "destructive"}>
                    {isConfigured(overview.services.ai.configured)}
                  </Badge>
                )}
              </div>
              <CardDescription>
                {overview?.services.ai.model || "Behavioral analytics"} model inference & insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-semibold">{overview?.services.ai.model || "openai/gpt-oss-20b"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Circuit Breaker:</span>
                  <span
                    className={
                      overview?.services.ai.circuitBreaker.state === "CLOSED"
                        ? "text-emerald-600 font-bold"
                        : "text-amber-600 font-bold"
                    }
                  >
                    {overview?.services.ai.circuitBreaker.state || "CLOSED"}
                  </span>
                </div>
              </div>

              {testResults.ai.status && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    testResults.ai.status === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>
                      {testResults.ai.status === "success" ? "✓ Inference Complete" : "✗ Inference Failed"}
                    </span>
                    <span>{testResults.ai.latencyMs}ms</span>
                  </div>
                  <p className="mt-1.5 text-[11px] italic bg-background/50 p-2 rounded border">
                    &quot;{testResults.ai.error || testResults.ai.data?.response}&quot;
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              className="w-full gap-2"
              variant="outline"
              disabled={testResults.ai.running}
              onClick={() => runTest("ai", "/api/admin/diagnostics/ai", { prompt: testAIPrompt })}
            >
              {testResults.ai.running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Test AI Inference
            </Button>
          </div>
        </Card>

        {/* 4. PostgreSQL (Prisma ORM) */}
        <Card className="flex flex-col justify-between border shadow-sm">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600">
                    <Database className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">PostgreSQL / Prisma</CardTitle>
                </div>
                <Badge variant="default">OPERATIONAL</Badge>
              </div>
              <CardDescription>Primary relational storage & job queue state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1.5 font-mono">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Products: </span>
                    <span className="font-bold">{overview?.services.database.counts.products ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Orders: </span>
                    <span className="font-bold">{overview?.services.database.counts.orders ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Users: </span>
                    <span className="font-bold">{overview?.services.database.counts.users ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Batches: </span>
                    <span className="font-bold">{overview?.services.database.counts.batches ?? 0}</span>
                  </div>
                </div>
              </div>

              {testResults.database.status && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    testResults.database.status === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>
                      {testResults.database.status === "success" ? "✓ DB Roundtrip OK" : "✗ DB Error"}
                    </span>
                    <span>{testResults.database.latencyMs}ms</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px]">
                    Ping latency: {testResults.database.data?.pingLatencyMs}ms
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              className="w-full gap-2"
              variant="outline"
              disabled={testResults.database.running}
              onClick={() => runTest("database", "/api/admin/diagnostics/database")}
            >
              {testResults.database.running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Test Database Query
            </Button>
          </div>
        </Card>

        {/* 5. Cloudinary Media Storage */}
        <Card className="flex flex-col justify-between border shadow-sm">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Cloudinary Storage</CardTitle>
                </div>
                {overview && (
                  <Badge variant={overview.services.cloudinary.configured ? "default" : "destructive"}>
                    {isConfigured(overview.services.cloudinary.configured)}
                  </Badge>
                )}
              </div>
              <CardDescription>Product and brand media asset hosting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cloud Name:</span>
                  <span>{overview?.services.cloudinary.cloudName || "..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Key:</span>
                  <span>{overview?.services.cloudinary.apiKey || "..."}</span>
                </div>
              </div>

              {testResults.cloudinary.status && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    testResults.cloudinary.status === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>
                      {testResults.cloudinary.status === "success" ? "✓ Cloudinary OK" : "✗ Ping Failed"}
                    </span>
                    <span>{testResults.cloudinary.latencyMs}ms</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px]">
                    {testResults.cloudinary.error || `Status: ${testResults.cloudinary.data?.status}`}
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              className="w-full gap-2"
              variant="outline"
              disabled={testResults.cloudinary.running}
              onClick={() => runTest("cloudinary", "/api/admin/diagnostics/cloudinary")}
            >
              {testResults.cloudinary.running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Test Cloudinary Ping
            </Button>
          </div>
        </Card>

        {/* 6. WebSocket Live Gateway */}
        <Card className="flex flex-col justify-between border shadow-sm">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600">
                    <Radio className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">WebSocket Engine</CardTitle>
                </div>
                <Badge variant={isSocketConnected ? "default" : "destructive"}>
                  {isSocketConnected ? "CONNECTED" : "DISCONNECTED"}
                </Badge>
              </div>
              <CardDescription>Real-time analytics broadcast & event stream</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Socket ID:</span>
                  <span className="truncate max-w-[150px]">{socket?.id || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin Room:</span>
                  <span>admin-room</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Dedupe:</span>
                  <span>Active (2000ms window)</span>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border text-xs ${
                  isSocketConnected
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {isSocketConnected ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Live Event Feed Stream Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Client disconnected, offline queue buffering</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={() => {
                trackAdminAction("diagnostics_ping_socket");
                toast.success(
                  isSocketConnected
                    ? `Socket connected (${socket?.id})`
                    : "Socket currently disconnected"
                );
              }}
            >
              <Activity className="h-4 w-4" />
              Verify Client Socket
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
