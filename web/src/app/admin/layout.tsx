import { Lato } from "next/font/google";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AdminProtected } from "@/components/layout/AdminProtected";


const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function AdminLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
        <div className={`${lato.variable} antialiased`}>
          <AdminProtected>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "16.5rem",
                "--header-height": "3.5rem",
              } as React.CSSProperties
            }
          >
          <AppSidebar variant="inset" />
          <SidebarInset>
          <SiteHeader />
          {children}
          </SidebarInset>
        </SidebarProvider>
          </AdminProtected>
      </div>
    );
}
