"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { Product } from "@/types";

export interface DiscountCampaignProps {
  products?: Product[];
  isLoading?: boolean;
  onUpdateDiscount?: (slug: string, productId: string, discount: number) => Promise<void>;
}

export default function DiscountCampaign({
  products = [],
  isLoading = false,
  onUpdateDiscount,
}: DiscountCampaignProps) {
  const [discounts, setDiscounts] = useState<{ [productId: string]: number }>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (products && products.length > 0) {
      const initialDiscounts = Object.fromEntries(
        products.map((p) => [p.id, p.discount ?? 0])
      );
      setDiscounts(initialDiscounts);
    }
  }, [products]);

  const handleDiscountChange = (productId: string, value: number) => {
    setDiscounts((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleDiscountSubmit = async (slug: string, productId: string) => {
    const discount = discounts[productId];

    if (discount < 0 || discount > 100) {
      toast.error("Discount must be between 0 and 100");
      return;
    }

    if (onUpdateDiscount) {
      try {
        setLoadingSlug(slug);
        await onUpdateDiscount(slug, productId, discount);
        toast.success("Discount updated");
      } catch (err) {
        toast.error("Failed to update discount");
      } finally {
        setLoadingSlug(null);
      }
    }
  };

  if (isLoading) {
    return <p className="text-sm text-neutral-500 py-8">Loading products...</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>S/N</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Discount %</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, idx) => (
          <TableRow key={product.id}>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{product.name}</TableCell>
            <TableCell>{product.category}</TableCell>
            <TableCell>{product.price}</TableCell>
            <TableCell>
              <input
                type="number"
                className="border dark:border-neutral-700 bg-transparent p-1 w-20 rounded"
                value={discounts[product.id] ?? 0}
                min={0}
                max={100}
                onChange={(e) =>
                  handleDiscountChange(product.id, Number(e.target.value))
                }
              />
            </TableCell>
            <TableCell>
              <button
                className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition disabled:opacity-50"
                onClick={() => handleDiscountSubmit(product.slug, product.id)}
                disabled={loadingSlug === product.slug}
              >
                {loadingSlug === product.slug ? "Updating..." : "Apply"}
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
