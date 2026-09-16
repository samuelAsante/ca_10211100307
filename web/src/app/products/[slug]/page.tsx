import { fetchBackend } from "@/lib/fetch-backend";
import { Metadata } from "next";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
    try {
        const res = await fetchBackend(`/api/products/${slug}`, {
            next: { revalidate: 60 }
        });
        if (res && res.ok) {
            const data = await res.json();
            if (data && (data.name || data.title)) {
                return {
                    ...data,
                    name: data.name || data.title,
                    price: Number(data.price) || 0,
                    discount: Number(data.discount) || 0,
                    ratingFromManufacturer: data.ratingFromManufacturer ?? data.rating ?? 0,
                    images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ["/a.jpg"],
                    colors: Array.isArray(data.colors) ? data.colors : [],
                };
            }
        }
    } catch (error) {
        console.error("Error fetching product:", error);
    }

    return null;
}

async function getAllProducts() {
    try {
        const res = await fetchBackend("/api/products", {
            next: { revalidate: 60 }
        });
        if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                return data.map((p: any) => ({
                    ...p,
                    name: p.name || p.title,
                    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/a.jpg"],
                }));
            }
        }
    } catch (error) {
        console.error("Error fetching products:", error);
    }
    return [];
}

interface Params {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata(
    { params }: Params
): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (product?.name) {
        return {
            title: `${product.name} | J's Ashanti's Store`,
            description: product.description || "Browse kitchenware and appliances at J's Ashanti's Store.",
        };
    }

    return {
        title: "Product Details | J's Ashanti's Store",
        description: "Browse kitchenware and appliances at J's Ashanti's Store.",
    };
}

function getSimilarProducts(currentProduct: any, allProducts: any[]) {
    if (!currentProduct || !Array.isArray(allProducts)) return [];
    const { slug, category, subcategories, name = "", description = "" } = currentProduct;

    const keywords = [...name.split(" "), ...description.split(" ")].map((word: string) =>
      word.toLowerCase().replace(/[^\w]/g, "")
    );

    return allProducts
      .filter((item: any) => item.slug !== slug)
      .map((item: any) => {
        let score = 0;
        if (item.category === category) score += 3;

        if (item.subcategories && subcategories) {
          const match = item.subcategories.filter((sub: any) => subcategories.includes(sub));
          score += match.length;
        }

        const itemKeywords = [...(item.name || "").split(" "), ...(item.description || "").split(" ")]
          .map((word: string) => word.toLowerCase().replace(/[^\w]/g, ""));
        const keywordMatches = keywords.filter((word: string) => itemKeywords.includes(word));
        score += keywordMatches.length * 0.5;

        return { ...item, score };
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 4);
}

export default async function ProductDetailPage({ params }: Params) {
    const { slug } = await params;

    const product = await getProduct(slug);
    const allproducts = await getAllProducts();
    const similarProducts = product ? getSimilarProducts(product, allproducts) : [];

    return (
        <ProductDetailClient
            slug={slug}
            initialProduct={product}
            initialSimilarProducts={similarProducts}
        />
    );
}
