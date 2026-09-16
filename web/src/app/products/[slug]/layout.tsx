import { fetchBackend } from "@/lib/fetch-backend";
import { Metadata } from "next";
import { business } from "@/data/business";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ashantiskitchenware.com";

async function getProduct(slug: string) {
  try {
    const res = await fetchBackend(`/api/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res && res.ok) {
      const data = await res.json();
      if (data && (data.name || data.title)) {
        return data;
      }
    }
  } catch (error) {
    console.error("Error fetching product for metadata:", error);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
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

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
