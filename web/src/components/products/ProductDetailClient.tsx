"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBackendUrl } from "@/lib/backend-url";
import { CustomerRatings } from "@/components/products/customerRating";
import { ProductDisplayCarousel } from "@/components/products/displayCarousel";
import { ColorPlatte } from "@/components/products/colorPlatte";
import { ProductCount } from "@/components/products/productCount";
import { ProductReviews } from "@/components/products/ProductReview";
import { PriceWithIcon } from "@/components/products/discoutProduct";
import { ProductsCardDetails } from "@/components/products/productsCard";
import { ProductDisplayCarouselSkeleton } from "@/components/products/skeletons/ProductDisplayCarouselSkeleton";
import { ArrowLeft, Search } from "lucide-react";

interface ProductDetailClientProps {
  slug: string;
  initialProduct: any | null;
  initialSimilarProducts?: any[];
}

function calculateSimilarProducts(currentProduct: any, allProducts: any[]) {
  if (!currentProduct || !Array.isArray(allProducts)) return [];
  const { slug, category, subcategories, name = "", description = "" } = currentProduct;

  const keywords = [...name.split(" "), ...description.split(" ")].map((word: string) =>
    word.toLowerCase().replace(/[^\w]/g, "")
  );

  return allProducts
    .filter((item: any) => item.slug !== slug)
    .map((item: any) => {
      let score = 0;
      if (item.category === category) score += 3;

      if (item.subcategories && subcategories) {
        const match = item.subcategories.filter((sub: any) => subcategories.includes(sub));
        score += match.length;
      }

      const itemKeywords = [...(item.name || "").split(" "), ...(item.description || "").split(" ")]
        .map((word: string) => word.toLowerCase().replace(/[^\w]/g, ""));
      const keywordMatches = keywords.filter((word: string) => itemKeywords.includes(word));
      score += keywordMatches.length * 0.5;

      return { ...item, score };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 4);
}

export function ProductDetailClient({
  slug,
  initialProduct,
  initialSimilarProducts = [],
}: ProductDetailClientProps) {
  const [product, setProduct] = useState<any | null>(initialProduct);
  const [similarProducts, setSimilarProducts] = useState<any[]>(initialSimilarProducts);
  const [isLoading, setIsLoading] = useState<boolean>(!initialProduct);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setSimilarProducts(initialSimilarProducts);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const backendUrl = getBackendUrl();

    async function loadProduct() {
      setIsLoading(true);
      setNotFound(false);

      try {
        const res = await fetch(`${backendUrl}/api/products/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (isMounted) setNotFound(true);
          }
          return;
        }

        const data = await res.json();
        if (!data || (!data.name && !data.title)) {
          if (isMounted) setNotFound(true);
          return;
        }

        const formatted = {
          ...data,
          name: data.name || data.title,
          price: Number(data.price) || 0,
          discount: Number(data.discount) || 0,
          ratingFromManufacturer: data.ratingFromManufacturer ?? data.rating ?? 0,
          images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ["/a.jpg"],
          colors: Array.isArray(data.colors) ? data.colors : [],
        };

        if (isMounted) {
          setProduct(formatted);
        }

        // Fetch catalog for similar products
        try {
          const listRes = await fetch(`${backendUrl}/api/products`);
          if (listRes.ok) {
            const all = await listRes.json();
            if (Array.isArray(all) && isMounted) {
              const formattedAll = all.map((p: any) => ({
                ...p,
                name: p.name || p.title,
                images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/a.jpg"],
              }));
              setSimilarProducts(calculateSimilarProducts(formatted, formattedAll));
            }
          }
        } catch {
          // Non-blocking similar products fetch failure
        }
      } catch (err) {
        console.error("Client fetch for product failed:", err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug, initialProduct, initialSimilarProducts]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 mt-24">
        <div className="grid md:grid-cols-2 gap-8">
          <ProductDisplayCarouselSkeleton />
          <div className="mt-12 md:mt-0 flex flex-col justify-center space-y-4 animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4"></div>
            <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
            <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 mt-20">
        <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4 text-neutral-400">
          <Search className="w-10 h-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Product Not Found
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-8">
          We couldn&apos;t find the product you requested. It might have been updated, renamed, or is no longer in our catalog.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse All Products
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition"
          >
            <Search className="w-4 h-4" />
            Search Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 mt-24">
      <div className="grid md:grid-cols-2 gap-8">
        {product.images?.length > 0 ? (
          <ProductDisplayCarousel images={product.images} />
        ) : (
          <ProductDisplayCarouselSkeleton />
        )}

        <div className="mt-12 md:mt-0 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <div className="text-gray-700 dark:text-gray-300 mb-4">
            <PriceWithIcon
              price={product.price}
              discount={product.discount || 0}
              className="text-blue-700 duration-800"
              iconClassName="w-4 h-4 md:w-6 md:h-6"
              priceClassName="text-2xl md:text-3xl lg:text-4xl"
            />
          </div>

          {product.ratingFromManufacturer > 0 && (
            <div className="flex items-center gap-2 text-blue-500 mb-4">
              <CustomerRatings rating={product.ratingFromManufacturer} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {product.ratingFromManufacturer}/5 product rating
              </span>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-300 mb-6 text-justify">
            {product.description}
          </p>

          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="items-center gap-2 mb-6">
              <h5 className="text-neutral-600 dark:text-neutral-300 text-md md:text-xl mb-2">
                Colors
              </h5>
              <div className="flex gap-2">
                <ColorPlatte colors={product.colors} />
              </div>
            </div>
          )}

          {/* Cart Button */}
          <div className="flex justify-between items-center">
            <ProductCount product={product} />
          </div>

          {/* Reviews Section */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-2">Customer Reviews</h2>
            <ProductReviews productSlug={slug} />
          </div>
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div className="mt-48">
          <h2 className="text-center text-md md:text-xl font-bold mb-6">Similar Products</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {similarProducts.map((item: any) => (
              <ProductsCardDetails
                key={item.slug}
                id={item.id}
                mainImage={item.images[0]}
                name={item.name}
                price={item.price}
                description={item.description}
                slug={item.slug}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
