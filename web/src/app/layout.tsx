import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { Nebula } from "@/lib/font";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/components/analytics/socket-provider";
import { GlobalPageTracker } from "@/components/analytics/global-page-tracker";
import { CookieConsent } from "@/components/consent/CookieConsent";
import { business } from "@/data/business";
import { Providers } from "@/components/common/providers";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ashantiskitchenware.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${business.name} | Premium Kitchenware & Appliances in Ghana`,
    template: `%s | ${business.name}`,
  },
  description:
    "Shop premium cookware sets, cast iron skillets, blenders, and household appliances in Ghana. Fast delivery in Accra, verified quality, and secure Mobile Money or Card payment.",
  applicationName: business.name,
  keywords: [
    "Ashanti's Kitchenware",
    "kitchenware Ghana",
    "cookware sets Accra",
    "home appliances Ghana",
    "kitchen appliances Accra",
    "non-stick pots Ghana",
    "cast iron skillet Ghana",
    "blenders Accra",
    "buy kitchenware online Ghana",
    "mobile money payment kitchenware",
  ],
  authors: [{ name: business.name, url: baseUrl }],
  creator: business.name,
  publisher: business.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: baseUrl,
    siteName: business.name,
    title: `${business.name} | Premium Kitchenware & Appliances in Ghana`,
    description:
      "Shop premium cookware sets, cast iron skillets, blenders, and household appliances in Ghana with secure Mobile Money & Card checkout.",
    images: [
      {
        url: "/kitchenbackground.webp",
        width: 1200,
        height: 630,
        alt: `${business.name} Kitchenware & Cookware`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${business.name} | Premium Kitchenware & Appliances in Ghana`,
    description:
      "Discover quality cookware sets, non-stick pans, and appliances in Ghana with secure payments and fast delivery.",
    images: ["/kitchenbackground.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: business.name,
  legalName: business.legalName,
  url: baseUrl,
  logo: `${baseUrl}/img/cookingset.png`,
  description: business.tagline,
  telephone: business.phone,
  email: business.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: `${business.address.line1}, ${business.address.line2}`,
    addressLocality: business.address.city,
    addressCountry: "GH",
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: business.name,
  url: baseUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/search?query={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
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
          <Providers>
            <SocketProvider>
              <GlobalPageTracker />
              <LayoutWrapper>
                <Toaster position="top-center" reverseOrder={false} />
                {children}
              </LayoutWrapper>
              <CookieConsent />
            </SocketProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
