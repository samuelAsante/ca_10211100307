"use client";

import { AdminDashboard } from "@/components/admin/dashboard";
import { useProducts } from "@/hooks/use-products";
import { useOrders } from "@/hooks/use-orders";
import { useSession } from "@/lib/auth-client";

export default function AdminPage() {
  const { data: session } = useSession();
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: orders = [], isLoading: isLoadingOrders } = useOrders();

  const isLoading = isLoadingProducts || isLoadingOrders;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 p-6">
          <AdminDashboard
            user={session?.user}
            products={products}
            orders={orders}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
