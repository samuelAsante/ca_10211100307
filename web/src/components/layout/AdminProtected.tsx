'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";

type UserSession = {
  user?: {
    email: string;
    role: string;
    [key: string]: any;
  };
} | null;

export function AdminProtected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession() as {
    data: UserSession;
    isPending: boolean;
  };
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isPending || authChecked) return;

    if (!session) {
      console.log('No session found - redirecting to login');
      toast.error('Please login to access this page');
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'admin') {
      console.log('Unauthorized access attempt');
      toast.error('You must be an admin to access this page');
      router.push('/');
      return;
    }

    setAuthChecked(true);
  }, [session, isPending, router, authChecked]);

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-pulse text-3xl font-bold text-primary logo">
          Ashanti&apos;s Kitchenware
        </div>
      </div>
    );
  }

  return <>{children}</>;
}