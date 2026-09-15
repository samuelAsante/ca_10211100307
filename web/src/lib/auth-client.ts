import { getBackendUrl } from "@/lib/backend-url";
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, admin } from "@/lib/permissions";
import { getStoredToken, setStoredToken, clearStoredToken } from "@/lib/auth-token";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        admin,
      },
    }),
  ],
  baseURL: getBackendUrl(),
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => getStoredToken() ?? "",
    },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) setStoredToken(token);
    },
  },
});

export const googlesignIn = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
    callbackURL: "/auth-redirect", // landing route after sign-in
    errorCallbackURL: "/login?error=1",
  });
};

const { signOut: baseSignOut, ...rest } = authClient;

export async function signOut(...args: Parameters<typeof baseSignOut>) {
  const result = await baseSignOut(...args);
  clearStoredToken();
  return result;
}

export const { signIn, signUp, useSession } = rest;

export type Session = typeof authClient.$Infer.Session.user;
