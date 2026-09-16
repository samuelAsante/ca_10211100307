import { Hero } from "@/components/hero/Hero";
import Products from "@/components/products/product";
import { fetchBackend } from "@/lib/fetch-backend";

export default async function Home() {
  let heroProducts: any[] = [];
  try {
    const res = await fetchBackend("/api/products", {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });

    if (res?.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        heroProducts = data;
      }
    }
  } catch (err) {
    console.error("Failed to load hero products on page:", err);
  }

  return (
    <div className="min-h-screen w-full pb-20 font-[family-name:var(--font-lato)]">
      {/* Main Content */}
      <main className="w-full">
        <Hero products={heroProducts} />
        <Products />
      </main>
    </div>
  );
}
