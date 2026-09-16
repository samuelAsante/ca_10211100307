"use client";

import DiscountCampaign from "@/components/products/discountCampagin";
import { useProducts, useUpdateProduct } from "@/hooks/use-products";

export default function ProductDiscountsPage() {
  const { data: products = [], isLoading } = useProducts();
  const updateProductMutation = useUpdateProduct();

  const handleUpdateDiscount = async (slug: string, productId: string, discount: number) => {
    await updateProductMutation.mutateAsync({
      slug,
      discount,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Product Discounts</h1>
      <DiscountCampaign
        products={products}
        isLoading={isLoading}
        onUpdateDiscount={handleUpdateDiscount}
      />
    </div>
  );
}