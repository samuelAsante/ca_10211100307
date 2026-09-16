import { fetchBackend } from "@/lib/fetch-backend";
import { Suspense } from "react";
import { ProductsList } from "./ProductsList";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { pickFeaturedProducts } from "@/lib/utils";

export default async function Products() {
  let products: any[] = [];
  try {
    const res = await fetchBackend("/api/products", {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });

    if (res && res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        products = pickFeaturedProducts(data, 16);
      }
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div className="max-w-7xl mx-auto md:px-4 py-10 mb-8 md:mb-24">
      <Suspense fallback={<SkeletonGrid />}>
        <ProductsList products={products} />
      </Suspense>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
}
