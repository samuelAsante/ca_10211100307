import { getBackendUrl } from "@/lib/backend-url";
import { Suspense } from "react";
import { ProductsList } from "./ProductsList";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { pickFeaturedProducts } from "@/lib/utils";

import { products as mockProducts } from "@/data/data";

export default async function Products() {
  try {
    const res = await fetch(
      `${getBackendUrl()}/api/products`,
      {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const limitedProducts = pickFeaturedProducts(data, 16);
        return (
          <div className="max-w-7xl mx-auto md:px-4 py-10 mb-8 md:mb-24">
            <Suspense fallback={<SkeletonGrid />}>
              <ProductsList products={limitedProducts} />
            </Suspense>
          </div>
        );
      }
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  const fallbackProducts = pickFeaturedProducts(
    mockProducts.map((p) => ({ ...p, discount: (p as any).discount ?? 0 })),
    16
  );
  return (
    <div className="max-w-7xl mx-auto md:px-4 py-10 mb-8 md:mb-24">
      <Suspense fallback={<SkeletonGrid />}>
        <ProductsList products={fallbackProducts} />
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
