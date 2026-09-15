"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    authClient.getSession().then(({ data: session }) => {
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      const role = (session.user as { role?: string }).role;
      router.replace(role === "admin" ? "/admin" : "/cart");
    });
  }, [router]);

  return null;
}
