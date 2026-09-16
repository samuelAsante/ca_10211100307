"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { ProductForm } from "./ProductForm";
import { useProduct } from "@/hooks/use-products";
import { Loader2 } from "lucide-react";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: product, isLoading: loading, isError } = useProduct(slug);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !product) {
    return notFound();
  }

  return (
    <ProductForm
      product={{
        ...product,
        description: product.description || "",
        category: product.category || "",
        price: Number(product.price) || 0,
        discount: Number(product.discount) || 0,
      }}
    />
  );
}