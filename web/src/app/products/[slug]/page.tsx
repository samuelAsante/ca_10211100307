"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useProduct, useProducts } from "@/hooks/use-products";
import { useReviews, useCreateReview } from "@/hooks/use-reviews";
import { CustomerRatings } from "@/components/products/customerRating";
import { ProductDisplayCarousel } from "@/components/products/displayCarousel";
import { ColorPlatte } from "@/components/products/colorPlatte";
import { ProductCount } from "@/components/products/productCount";
import { ProductReviews, ReviewFormInputs } from "@/components/products/ProductReview";
import { PriceWithIcon } from "@/components/products/discoutProduct";
import { ProductsCardDetails } from "@/components/products/productsCard";
import { ProductDisplayCarouselSkeleton } from "@/components/products/skeletons/ProductDisplayCarouselSkeleton";
import { ArrowLeft, Search } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function calculateSimilarProducts(currentProduct: any, allProducts: any[]) {
  if (!currentProduct || !Array.isArray(allProducts)) return [];
  const { slug, category, subcategories, name = "", description = "" } = currentProduct;

  const otherProducts = allProducts.filter((p) => p.slug !== slug);

  const scored = otherProducts.map((p) => {
    let score = 0;
    if (category && p.category && p.category.toLowerCase() === category.toLowerCase()) {
      score += 5;
    }
    if (Array.isArray(subcategories) && Array.isArray(p.subcategories)) {
      const common = subcategories.filter((s) => p.subcategories.includes(s));
      score += common.length * 3;
    }
    const currentWords = `${name} ${description}`.toLowerCase().split(/\s+/).filter(Boolean);
    const candidateWords = `${p.name || ""} ${p.description || ""}`.toLowerCase().split(/\s+/).filter(Boolean);
    const overlap = currentWords.filter((w: string) => w.length > 3 && candidateWords.includes(w));
    score += overlap.length;

    return { product: p, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.product);
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);

  // Module-based query hooks for product, catalog, and reviews
  const { data: rawProduct, isLoading: isProductLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { data: reviews = [], isLoading: isLoadingReviews } = useReviews(slug);
  const createReviewMutation = useCreateReview();

  const product = useMemo(() => {
    if (!rawProduct || (!rawProduct.name && !rawProduct.title)) return null;

    return {
      ...rawProduct,
      name: rawProduct.name || rawProduct.title,
      price: Number(rawProduct.price) || 0,
      discount: Number(rawProduct.discount) || 0,
      ratingFromManufacturer: rawProduct.ratingFromManufacturer ?? rawProduct.rating ?? 0,
      images: Array.isArray(rawProduct.images) && rawProduct.images.length > 0 ? rawProduct.images : ["/a.jpg"],
      colors: Array.isArray(rawProduct.colors) ? rawProduct.colors : [],
    };
  }, [rawProduct]);

  const similarProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    const formatted = allProducts.map((p: any) => ({
      ...p,
      name: p.name || p.title,
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/a.jpg"],
    }));
    return calculateSimilarProducts(product, formatted);
  }, [product, allProducts]);

  const handleAddReview = async (data: ReviewFormInputs) => {
    if (!slug) return;
    await createReviewMutation.mutateAsync({
      customerName: data.customerName,
      review: data.review,
      rating: data.rating,
      productSlug: slug,
    });
  };

  if (isProductLoading) {
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

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 mt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The product you are looking for does not exist or has been removed.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
          >
            <Search className="w-4 h-4" />
            Search Products
          </Link>
        </div>
      </div>
    );
  }

  const effectivePrice =
    product.discount && product.discount > 0
      ? Number((product.price * (1 - product.discount / 100)).toFixed(2))
      : Number(product.price || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 mt-24">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left column: Images carousel */}
        <div>
          <ProductDisplayCarousel images={product.images} />
        </div>

        {/* Right column: Product details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              Category: {product.category || "General"}
            </p>
          </div>

          <CustomerRatings
            rating={product.ratingFromManufacturer ?? product.rating ?? 0}
          />

          <PriceWithIcon
            price={product.price}
            discount={product.discount}
          />

          <p className="text-muted-foreground">{product.description}</p>

          {/* Color variations if available */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <ColorPlatte colors={product.colors} />
            </div>
          )}

          {/* Quantity selector & Add to Cart button */}
          <div className="flex justify-between items-center">
            <ProductCount
              product={{
                id: product.id,
                name: product.name || "",
                price: product.price,
                discount: product.discount,
                image: product.images?.[0],
              }}
            />
          </div>

          {/* Reviews Section */}
          <div className="mt-10">
            <ProductReviews
              productSlug={product.slug}
              reviews={reviews}
              isLoading={isLoadingReviews}
              onSubmitReview={handleAddReview}
              isSubmitting={createReviewMutation.isPending}
            />
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
