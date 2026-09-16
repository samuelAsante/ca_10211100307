"use client";

import { useProducts } from "@/hooks/use-products";
import { AdminProductsTable } from "./productTable";
import { Loader2 } from "lucide-react";

export default function AdminProducts() {
  const { data: products = [], isLoading: loading } = useProducts();

  return (
    <div className="md:max-w-7xl px-4 py-10 mb-8 md:mb-24">
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <AdminProductsTable products={products} />
      )}
    </div>
  );
}
