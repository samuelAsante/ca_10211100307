import { getBackendUrl } from "@/lib/backend-url";
import { Lato } from "next/font/google";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { headers } from "next/headers";
import { redirect } from "next/navigation";


const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const BACKEND_URL = getBackendUrl();

export default async function AdminLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {

  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";

  let session: { user?: { role?: string } } | null = null;
  try {
    const sessionRes = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (sessionRes.ok) {
      session = await sessionRes.json();
    }
  } catch (error) {
    console.error("Failed to load admin session:", error);
  }
  if (!session?.user) return redirect("/login");

  // Check if user is admin
  if (session.user.role !== "admin") return redirect("/");

    return (
        <div className={`${lato.variable} antialiased`}>
          <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
          <SiteHeader />
          {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    );
}
  