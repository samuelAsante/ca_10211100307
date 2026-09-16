import { fetchBackend } from "@/lib/fetch-backend";
import { Metadata } from "next";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";
import { business } from "@/data/business";

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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ashantiskitchenware.com";

export async function generateMetadata(
    { params }: Params
): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (product?.name) {
        const title = `${product.name} | ${business.name}`;
        const description = product.description 
          ? product.description.slice(0, 160).trim()
          : `Buy ${product.name} online at ${business.name} Ghana. Premium cookware and kitchen appliances with fast delivery.`;
        const firstImage = product.images?.[0]?.startsWith("http")
          ? product.images[0]
          : `${baseUrl}${product.images?.[0] || "/kitchenbackground.webp"}`;

        return {
            title,
            description,
            alternates: {
                canonical: `/products/${encodeURIComponent(slug)}`,
            },
            openGraph: {
                title,
                description,
                url: `${baseUrl}/products/${encodeURIComponent(slug)}`,
                type: "website",
                images: [
                    {
                        url: firstImage,
                        width: 800,
                        height: 800,
                        alt: product.name,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [firstImage],
            },
        };
    }

    return {
        title: `Product Details | ${business.name}`,
        description: `Browse premium kitchenware, cookware sets, and home appliances at ${business.name} Ghana.`,
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

    const effectivePrice = product?.discount && product.discount > 0
      ? Number((product.price * (1 - product.discount / 100)).toFixed(2))
      : Number(product?.price || 0);

    const productSchema = product ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || `Buy ${product.name} at ${business.name} Ghana`,
        image: product.images?.map((img: string) => img.startsWith("http") ? img : `${baseUrl}${img}`) || [],
        sku: product.sku || slug,
        brand: {
            "@type": "Brand",
            name: business.name,
        },
        offers: {
            "@type": "Offer",
            url: `${baseUrl}/products/${encodeURIComponent(slug)}`,
            priceCurrency: "GHS",
            price: effectivePrice,
            availability: (product.stock && product.stock > 0)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            seller: {
                "@type": "Organization",
                name: business.name,
            },
        },
        ...(product.ratingFromManufacturer ? {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.ratingFromManufacturer,
                bestRating: 5,
                worstRating: 1,
                ratingCount: 1,
            },
        } : {}),
    } : null;

    return (
        <>
            {productSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
                />
            )}
            <ProductDetailClient
                slug={slug}
                initialProduct={product}
                initialSimilarProducts={similarProducts}
            />
        </>
    );
}
