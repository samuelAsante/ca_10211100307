"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import { ProductForm, ProductFormInputs } from "@/components/admin/products/ProductForm";
import { useProduct, useUpdateProduct } from "@/hooks/use-products";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: product, isLoading: loading, isError } = useProduct(slug);
  const updateProductMutation = useUpdateProduct();

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

  const handleUpdateProduct = async (data: ProductFormInputs) => {
    try {
      await updateProductMutation.mutateAsync({
        slug: product.slug,
        ...data,
      });

      toast.success("Product updated successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      console.error("Failed to update product:", err);
      toast.error("Failed to update product.");
    }
  };

  return (
    <ProductForm
      product={{
        ...product,
        description: product.description || "",
        category: product.category || "",
        price: Number(product.price) || 0,
        discount: Number(product.discount) || 0,
      }}
      onSubmit={handleUpdateProduct}
      isSubmitting={updateProductMutation.isPending}
    />
  );
}