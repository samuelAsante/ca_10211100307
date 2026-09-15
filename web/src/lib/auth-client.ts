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

export async function signOut(...args: Parameters<typeof authClient.signOut>) {
  const result = await authClient.signOut(...args);
  clearStoredToken();
  return result;
}

export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const useSession = authClient.useSession;

export type Session = typeof authClient.$Infer.Session.user;
