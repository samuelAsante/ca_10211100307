"use client";

import { AddProductForm } from "@/components/admin/products/AddProductForm";
import { useUpload } from "@/hooks/use-upload";
import { useCreateProduct } from "@/hooks/use-products";
import { ProductFormData } from "@/lib/validations/productSchema";
import { toast } from "react-hot-toast";

export default function AddProductPage() {
  const uploadMutation = useUpload();
  const createProductMutation = useCreateProduct();

  const handleCreateProduct = async (data: ProductFormData) => {
    try {
      // 1. Upload files
      let uploadedImageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        const uploadPromises = data.images.map(async (file: File) => {
          const res = await uploadMutation.mutateAsync(file);
          return res?.secure_url || res?.url || "";
        });
        uploadedImageUrls = (await Promise.all(uploadPromises)).filter(Boolean);
      }

      // 2. Create product via module hook
      await createProductMutation.mutateAsync({
        ...data,
        images: uploadedImageUrls,
      });

      toast.success("Product created successfully!");
    } catch (err) {
      console.error("Failed to create product:", err);
      toast.error("Failed to create product.");
    }
  };

  const isSubmitting = uploadMutation.isPending || createProductMutation.isPending;

  return (
    <main className="min-h-screen py-10 px-4">
      <AddProductForm
        onSubmit={handleCreateProduct}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
