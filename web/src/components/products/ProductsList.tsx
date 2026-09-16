"use client";

import Link from "next/link";
import { ProductsCardDetails } from "./productsCard";
import { TiArrowRight } from "react-icons/ti";
import { motion } from "framer-motion";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { Product } from "@/types";

export interface ProductsListProps {
  products?: Product[] | any[];
  isLoading?: boolean;
}

export function ProductsList({ products = [], isLoading = false }: ProductsListProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg lg:text-2xl font-bold">Featured Products</h1>
        <Link href="/products" className="flex text-[12px] text-blue-600 hover:underline gap-2">
          View All Products
          <span>
            <TiArrowRight className="text-2xl animate-pulse transition" />
          </span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, idx) => <ProductCardSkeleton key={idx} />)
          : products.map((product, index) => (
              <ProductsCardDetails
                key={product.id || index}
                {...product}
                mainImage={product.images?.[0]}
                rating={product.ratingFromManufacturer}
              />
            ))}
      </motion.div>
    </>
  );
}
