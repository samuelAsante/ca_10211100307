import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { Nebula } from "@/lib/font";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/components/analytics/socket-provider";
import { GlobalPageTracker } from "@/components/analytics/global-page-tracker";
import { CookieConsent } from "@/components/consent/CookieConsent";
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "J's Ashanti's Store Online",
  description: "E-commerce platform for all appliances products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${lato.variable} ${Nebula.variable}`}
    >
      <body
        className={`${lato.variable} antialiased bg-gradient-radial-light dark:bg-gradient-radial-dark`}
      >
        <ThemeProvider
          attribute={"class"}
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <SocketProvider>
            <GlobalPageTracker />
            <LayoutWrapper>
              <Toaster position="top-center" reverseOrder={false} />
              {children}
            </LayoutWrapper>
            <CookieConsent />
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
