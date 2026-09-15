import { getBackendUrl } from "@/lib/backend-url";
import { AdminProductsTable } from './productTable';

const BACKEND_URL = getBackendUrl();

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const res = await fetch(`${BACKEND_URL}/api/products`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch products");
  const products = await res.json();
  if (!Array.isArray(products)) throw new Error("Invalid JSON from products API");

  return (
    <div className="md:max-w-7xl px-4 py-10 mb-8 md:mb-24">
      <AdminProductsTable products={products} />
    </div>
  );
}
