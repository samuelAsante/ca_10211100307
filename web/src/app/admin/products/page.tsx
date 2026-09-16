"use client";

import Link from "next/link";
import { useProducts, useLowStockProducts, useDeleteProduct } from "@/hooks/use-products";
import { AdminProductsTable } from "@/components/admin/products/ProductTable";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconEdit } from "@tabler/icons-react";

export default function AdminProducts() {
  const { data: products = [], isLoading: loading } = useProducts();
  const { data: lowStockData } = useLowStockProducts(5);
  const deleteProductMutation = useDeleteProduct();

  const handleDeleteProduct = async (productId: string) => {
    await deleteProductMutation.mutateAsync(productId);
  };

  const lowStockItems = lowStockData?.products || [];

  return (
    <div className="md:max-w-7xl px-4 py-10 mb-8 md:mb-24 space-y-6">
      {/* Low Stock Alert Center */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <IconAlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Low Stock Alert: {lowStockItems.length} Cookware Item{lowStockItems.length > 1 ? "s" : ""} Need Restocking
                  </h3>
                  <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-300 text-xs">
                    Threshold: &le; 5 units
                  </Badge>
                </div>

                <p className="text-xs text-amber-700 dark:text-amber-300">
                  The following items are running out. Update inventory or order more sets from suppliers.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1 text-xs shadow-2xs"
                    >
                      <span className="font-medium text-neutral-900 dark:text-white truncate max-w-[150px]">
                        {item.name}
                      </span>
                      <Badge
                        variant={item.stock === 0 ? "destructive" : "secondary"}
                        className="text-[10px] px-1.5 py-0 font-bold"
                      >
                        {item.stock === 0 ? "0 left" : `${item.stock} left`}
                      </Badge>
                      <Link
                        href={`/admin/products/${item.slug}/edit`}
                        className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
                        title="Edit stock"
                      >
                        <IconEdit className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : (
        <AdminProductsTable
          products={products}
          onDeleteProduct={handleDeleteProduct}
          isDeleting={deleteProductMutation.isPending}
        />
      )}
    </div>
  );
}
