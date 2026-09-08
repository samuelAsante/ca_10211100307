import { getBackendUrl } from "@/lib/backend-url";
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, admin } from "@/lib/permissions";

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
});

export const googlesignIn = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
    callbackURL: "/auth-redirect", // landing route after sign-in
    errorCallbackURL: "/login?error=1",
  });
};
export const { signIn, signUp, signOut, useSession } = authClient;

export type Session = typeof authClient.$Infer.Session.user;
