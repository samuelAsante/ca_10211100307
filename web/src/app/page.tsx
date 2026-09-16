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
    <div className="min-h-screen p-4 md:p-0 pb-20 gap-16 font-[family-name:var(--font-lato)] mx-auto">
      {/* Main Content */}
      <main className="mx-auto">
        <Hero products={heroProducts} />
        <Products />
      </main>
    </div>
  );
}
