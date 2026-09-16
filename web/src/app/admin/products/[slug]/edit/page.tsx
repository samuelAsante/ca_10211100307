"use client";

import { useEffect, useState, use } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { notFound } from "next/navigation";
import { ProductForm } from "./ProductForm";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const backendUrl = getBackendUrl();
        const res = await axios.get(`${backendUrl}/api/products/${slug}`, {
          withCredentials: true,
        });
        if (res.data && res.data.id) {
          setProduct(res.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch product for editing:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !product) {
    return notFound();
  }

  return <ProductForm product={product} />;
}