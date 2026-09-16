import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { PaystackService } from "../services/paystack.service";
import { Resend } from "resend";
import Groq from "groq-sdk";
import { aiCircuitBreaker } from "../lib/circuit-breaker";
import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary";

function maskSecret(secret?: string | null): string {
  if (!secret) return "Not configured";
  if (secret.length <= 8) return "********";
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export class DiagnosticsController {
  /**
   * GET /api/admin/diagnostics/overview
   * Returns configuration status, circuit breaker states, and live probes
   */
  static async getOverview(req: Request, res: Response) {
    const session = (req as any).session;
    if (!session?.user?.id || session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    const resendKey = process.env.RESEND_API_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();

    // Measure database latency
    let dbStatus = "OPERATIONAL";
    let dbLatencyMs = 0;
    let counts = { products: 0, orders: 0, users: 0, batches: 0, events: 0 };

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;

      const [products, orders, users, batches, events] = await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.batch.count(),
        prisma.event.count(),
      ]);
      counts = { products, orders, users, batches, events };
    } catch (err) {
      dbStatus = "FAILED";
      console.error("[Diagnostics] DB probe error:", err);
    }

    const cbMetrics = aiCircuitBreaker.getMetrics();

    return res.json({
      timestamp: new Date().toISOString(),
      services: {
        paystack: PaystackService.getDiagnosticInfo(),
        email: {
          configured: !!resendKey,
          provider: "Resend",
          maskedKey: maskSecret(resendKey),
          sender: process.env.EMAIL_FROM?.trim() || "JS Ashanti <onboarding@resend.dev>",
        },
        ai: {
          configured: !!groqKey,
          provider: "Groq LLaMA 3.3 70B",
          maskedKey: maskSecret(groqKey),
          model: "llama-3.3-70b-versatile",
          circuitBreaker: {
            state: cbMetrics.state,
            failures: cbMetrics.failureCount,
            lastChange: cbMetrics.lastStateChange?.toISOString() || null,
          },
        },
        database: {
          configured: true,
          provider: "PostgreSQL (Prisma)",
          status: dbStatus,
          latencyMs: dbLatencyMs,
          counts,
        },
        cloudinary: {
          configured: isCloudinaryConfigured(),
          cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || "Not configured",
          apiKey: maskSecret(process.env.CLOUDINARY_API_KEY?.trim()),
        },
      },
      system: {
        nodeEnv: process.env.NODE_ENV || "development",
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    });
  }

  /**
   * POST /api/admin/diagnostics/paystack
   * Live connectivity and API check against Paystack (delegated to PaystackService)
   */
  static async testPaystack(req: Request, res: Response) {
    const session = (req as any).session;
    if (!session?.user?.id || session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    try {
      const result = await PaystackService.checkConnectivity(session.user?.email);
      if (!result.ok) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        status: "FAILED",
        error: err.message || "Failed to reach Paystack API",
      });
    }
  }

  /**
   * POST /api/admin/diagnostics/email
   * Sends a diagnostic test email via Resend
   */
  static async testEmail(req: Request, res: Response) {
    const session = (req as any).session;
    if (!session?.user?.id || session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
      return res.status(400).json({
        ok: false,
        error: "RESEND_API_KEY is not configured in backend environment",
      });
    }

    const targetEmail = req.body.to?.trim() || session.user.email;
    if (!targetEmail || !targetEmail.includes("@")) {
      return res.status(400).json({
        ok: false,
        error: "Please provide a valid recipient email address",
      });
    }

    const from = process.env.EMAIL_FROM?.trim() || "JS Ashanti <onboarding@resend.dev>";
    const start = Date.now();

    try {
      const resend = new Resend(key);
      const testTimestamp = new Date().toLocaleString();

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">JS Ashanti Service Diagnostic</h2>
          <p style="color: #475569; font-size: 14px; margin-top: 0;">Transactional Email Health Check</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0;">
            <strong style="color: #065f46;">✓ Resend Integration Operational</strong>
            <p style="margin: 4px 0 0; font-size: 13px; color: #334155;">This test email verifies that your Resend API credentials, sender domain, and network connectivity are working correctly.</p>
          </div>
          <table style="width: 100%; font-size: 13px; color: #334155; margin: 16px 0;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Sender:</td>
              <td style="padding: 4px 0; font-weight: 500;">${from}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Recipient:</td>
              <td style="padding: 4px 0; font-weight: 500;">${targetEmail}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Tested By:</td>
              <td style="padding: 4px 0; font-weight: 500;">${session.user.name || "Admin"} (${session.user.email})</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Timestamp:</td>
              <td style="padding: 4px 0; font-weight: 500;">${testTimestamp}</td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Generated automatically by JS Ashanti Admin Diagnostics.</p>
        </div>
      `;

      const response = await resend.emails.send({
        from,
        to: targetEmail,
        subject: `[Diagnostic] JS Ashanti Email Service Test - ${testTimestamp}`,
        html,
      });

      const latencyMs = Date.now() - start;

      if (response.error) {
        return res.status(400).json({
          ok: false,
          latencyMs,
          error: response.error.message || "Resend returned an error while sending email",
        });
      }

      return res.json({
        ok: true,
        latencyMs,
        messageId: response.data?.id,
        to: targetEmail,
        from,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message || "Failed to execute email test",
      });
    }
  }

  /**
   * POST /api/admin/diagnostics/ai
   * Live prompt inference probe with Groq LLaMA 3.3 70B
   */
  static async testAI(req: Request, res: Response) {
    const session = (req as any).session;
    if (!session?.user?.id || session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    const key = process.env.GROQ_API_KEY?.trim();
    if (!key) {
      return res.status(400).json({
        ok: false,
        error: "GROQ_API_KEY is not configured in backend environment",
      });
    }

    const start = Date.now();
    try {
      const groq = new Groq({ apiKey: key, timeout: 20_000 });
      const prompt = req.body.prompt || "Verify connection to JS Ashanti analytics engine in one short sentence.";

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 60,
      });

      const latencyMs = Date.now() - start;
      const text = completion.choices?.[0]?.message?.content?.trim() || "No response received";

      return res.json({
        ok: true,
        latencyMs,
        model: "llama-3.3-70b-versatile",
        prompt,
        response: text,
        usage: completion.usage,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message || "Groq AI inference failed",
      });
    }
  }

  /**
   * POST /api/admin/diagnostics/database
   * Measures roundtrip query latency and returns table breakdown
   */
  static async testDatabase(req: Request, res: Response) {
    const session = (req as any).session;
    if (!session?.user?.id || session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1 as ping`;
      const pingLatency = Date.now() - start;

      const [products, orders, users, batches, events, insights] = await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.batch.count(),
        prisma.event.count(),
        prisma.insight.count(),
      ]);

      const totalLatency = Date.now() - start;

      return res.json({
        ok: true,
        pingLatencyMs: pingLatency,
        totalLatencyMs: totalLatency,
        counts: {
          products,
          orders,
          users,
          batches,
          events,
          insights,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message || "Database query failed",
      });
    }
  }

  /**
   * POST /api/admin/diagnostics/cloudinary
   * Tests Cloudinary connectivity and API status
   */
  static async testCloudinary(req: Request, res: Response) {
    const session = (req as any).session;
    if (!session?.user?.id || session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(400).json({
        ok: false,
        error: "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing",
      });
    }

    const start = Date.now();
    try {
      const pingResult = await cloudinary.api.ping();
      const latencyMs = Date.now() - start;

      return res.json({
        ok: true,
        latencyMs,
        status: pingResult?.status || "ok",
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message || "Failed to reach Cloudinary API",
      });
    }
  }
}
