"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { HeroCard } from "./HeroCard";
import HeroSkeleton from "./HeroSkeleton";
import { Product } from "@/types";

export interface HeroProps {
  products?: Product[];
  loading?: boolean;
}

export function Hero({ products = [], loading = false }: HeroProps) {
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 7000, stopOnInteraction: false })
  );

  const displayProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];

    const discounted = products.filter(
      (p) => p.discount && Number(p.discount) > 0
    );

    if (discounted.length > 0) {
      return discounted.slice(0, 5);
    }

    return products.slice(0, 5);
  }, [products]);

  if (loading) {
    return <HeroSkeleton />;
  }

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto md:px-4 mb-4 md:mb-12">
      <Carousel
        plugins={[autoplayPlugin.current]}
        className="w-full"
        onMouseEnter={autoplayPlugin.current.stop}
        onMouseLeave={autoplayPlugin.current.reset}
      >
        <CarouselContent>
          {displayProducts.map((product) => (
            <CarouselItem key={product.id || product.slug}>
              <HeroCard
                id={product.id}
                title={product.title || product.name || ""}
                description={product.description || ""}
                imageUrl={product.images?.[0] || "/kitchenbackground.webp"}
                discount={product.discount ?? 0}
                slug={product.slug}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
