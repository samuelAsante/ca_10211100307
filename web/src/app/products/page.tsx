import { fetchBackend } from "@/lib/fetch-backend";
import type { Metadata } from "next";
import { ProductsClient } from "@/components/products/ProductsClient";
import { prioritizeDiscountedProducts } from "@/lib/utils";
import { business } from "@/data/business";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ashantiskitchenware.com";

export const metadata: Metadata = {
  title: "Kitchenware, Cookware & Home Appliances Catalog",
  description:
    "Explore our complete catalog of cookware sets, frying pans, blenders, pressure cookers, and kitchen essentials in Ghana. Premium quality with local delivery across Accra.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: `Kitchenware & Cookware Catalog | ${business.name}`,
    description:
      "Browse premium kitchenware, non-stick cookware sets, and home appliances in Ghana with secure mobile money checkout.",
    url: `${baseUrl}/products`,
    type: "website",
    images: [
      {
        url: "/kitchenbackground.webp",
        width: 1200,
        height: 630,
        alt: `${business.name} Catalog`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Kitchenware & Cookware Catalog | ${business.name}`,
    description: "Browse premium kitchenware and cookware sets in Ghana with fast delivery.",
    images: ["/kitchenbackground.webp"],
  },
};

interface ProductsProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function Products({ searchParams: searchParamsPromise }: ProductsProps) {
  const searchParams = await searchParamsPromise;

  const res = await fetchBackend("/api/products", {
    next: { revalidate: 60 },
  });

  let products: any[] = [];
  if (res?.ok) {
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      products = data;
    }
  }

  if (Array.isArray(products) && products.length > 0) {
    products = prioritizeDiscountedProducts(products);
  }

  return <ProductsClient products={products} searchParams={searchParams} />;
}
