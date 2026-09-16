"use client";

import { useEffect, useState } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { AdminProductsTable } from "./productTable";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const backendUrl = getBackendUrl();
        const res = await axios.get(`${backendUrl}/api/products`, {
          withCredentials: true,
        });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load admin products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

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
