import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { customSession, bearer } from "better-auth/plugins";
import { admin as adminPlugin } from "better-auth/plugins";
import { ac, admin } from "./permissions";
import { EmailService } from "../services/email.service";
import { getAllowedOrigins } from "./origins";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

function isHttpsOrigin(url: string | undefined): boolean {
  return Boolean(url?.startsWith("https://"));
}

function getCookieAttributes() {
  if (process.env.NODE_ENV !== "production") {
    return {};
  }

  const https = isHttpsOrigin(process.env.FRONTEND_URL) || isHttpsOrigin(process.env.BETTER_AUTH_URL);

  try {
    const frontendHost = process.env.FRONTEND_URL
      ? new URL(process.env.FRONTEND_URL).host
      : "";
    const authHost = process.env.BETTER_AUTH_URL
      ? new URL(process.env.BETTER_AUTH_URL).host
      : "";
    const splitOrigins = Boolean(frontendHost && authHost && frontendHost !== authHost);

    return {
      sameSite: (splitOrigins && https ? "none" : "lax") as "none" | "lax",
      secure: https,
    };
  } catch {
    return {
      sameSite: "lax" as const,
      secure: https,
    };
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: getAllowedOrigins(),
  emailVerification: {
    sendVerificationEmail: async ({ url, user }) => {
      try {
        await EmailService.sendVerificationEmail(url, user);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Graceful failure: don't throw, allowing the user to at least exist in DB
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
    maxPasswordLength: 100,
    requireEmailVerification: false,
    // callbackUrl: '/', // Not needed for API-only backend typically, or set to frontend URL
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            prompt: "select_account" as const,
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    customSession(async (session) => {
      const userWithRole = session.user as typeof session.user & {
        role: string;
      };

      return {
        ...session,
        user: {
          ...userWithRole,
          role: userWithRole.role ?? "user",
        },
      };
    }),
    // better-auth admin plugin types don't match BetterAuthPlugin in this version
    // @ts-ignore
    adminPlugin({
      adminUserIds: process.env.ADMIN_ID ? [process.env.ADMIN_ID] : [],
      adminRoles: ["admin"],
      ac,
      roles: {
        admin,
      },
    }),
    bearer(),
  ],
  advanced: {
    cookies: {
      session_token: {
        name: "auth-cookies.session_token",
        attributes: {},
      },
    },
    useSecureCookies:
      process.env.NODE_ENV === "production" &&
      (isHttpsOrigin(process.env.FRONTEND_URL) || isHttpsOrigin(process.env.BETTER_AUTH_URL)),
    defaultCookieAttributes: getCookieAttributes(),
  },
});
