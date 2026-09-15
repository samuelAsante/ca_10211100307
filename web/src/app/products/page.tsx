//@ts-nocheck
import { fetchBackend } from "@/lib/fetch-backend";
import type { Metadata } from "next"
import { ProductsClient } from "@/components/products/ProductsClient";
import { products as mockProducts } from "@/data/data";
import { prioritizeDiscountedProducts } from "@/lib/utils";

export const metadata: Metadata = {
  title: "J's Ashanti's Store Online - Products",
}

interface ProductsProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function Products({ searchParams: searchParamsPromise }: ProductsProps) {
  const searchParams = await searchParamsPromise;

  const res = await fetchBackend("/api/products", {
    next: { revalidate: 60 },
  });

  let products = mockProducts;
  if (res?.ok) {
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      products = data;
    }
  }

  if (Array.isArray(products)) {
    products = prioritizeDiscountedProducts(products);
  }

  return <ProductsClient products={products} searchParams={searchParams} />;
}
