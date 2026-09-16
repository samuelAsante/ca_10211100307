"use client";

import { useState, useEffect, Suspense } from "react";
import { useProducts } from "@/hooks/use-products";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryParamsState } from "@/hooks/use-query-state";
import { ProductsCardDetails } from "@/components/products/productsCard";
import { IconSearch, IconFilter, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { label: "All Products", value: "all" },
  { label: "Cookware Sets", value: "Cookware Sets" },
  { label: "Frying Pans", value: "Frying Pans" },
  { label: "Kitchen Appliances", value: "KITCHEN APPLIANCES" },
  { label: "Cooking Wares & Sets", value: "COOKING WARES & SETS" },
  { label: "Storage & Insulations", value: "STORAGE & INSULATIONS" },
  { label: "Home Essentials", value: "HOME ESSENTIALS" },
];

function SearchContent() {
  // Synchronize search params with URL to preserve states on refresh
  const [params, setParams] = useQueryParamsState({
    query: "",
    category: "all",
    sort: "newest",
  });

  const [inputTerm, setInputTerm] = useState(params.query);

  // If URL query changes (e.g. initial load or external navigation), sync input term
  useEffect(() => {
    setInputTerm(params.query);
  }, [params.query]);

  // Debounce the text input by 300ms before triggering API search & URL update
  const debouncedQuery = useDebounce(inputTerm.trim(), 300);

  // Sync debounced search term to URL query state
  useEffect(() => {
    if (debouncedQuery !== params.query) {
      setParams({ query: debouncedQuery });
    }
  }, [debouncedQuery, params.query, setParams]);

  // TanStack Query products hook with active parameters
  const { data: products = [], isLoading, isFetching } = useProducts({
    search: params.query.length > 0 ? params.query : undefined,
    category: params.category !== "all" ? params.category : undefined,
    sort: params.sort,
  });

  const handleResetFilters = () => {
    setInputTerm("");
    setParams({
      query: "",
      category: "all",
      sort: "newest",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mb-12 pt-28 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            {params.query
              ? `Search Results for "${params.query}"`
              : "Search Cookware & Kitchen Appliances"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Browse our durable non-stick and granite cookware collections available in Accra and across Ghana.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            type="search"
            value={inputTerm}
            onChange={(e) => setInputTerm(e.target.value)}
            placeholder="Search cookware sets, pressure cookers, pots, frying pans..."
            className="w-full pl-11 pr-12 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-neutral-900 dark:text-white"
          />
          {isFetching && (
            <IconLoader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-red-600" />
          )}
        </div>

        {/* Category Filter Pills & Sort Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400 flex items-center gap-1 mr-1">
              <IconFilter className="h-3.5 w-3.5" /> Category:
            </span>
            {CATEGORIES.map((cat) => {
              const isActive = cat.value.toLowerCase() === params.category.toLowerCase();

              return (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setParams({ category: cat.value })}
                  className={`text-xs px-3 py-1.5 rounded-full transition font-medium border cursor-pointer ${
                    isActive
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Sort:</span>
            <button
              type="button"
              onClick={() => setParams({ sort: "newest" })}
              className={`cursor-pointer hover:text-red-600 ${
                params.sort === "newest" ? "font-bold text-red-600" : ""
              }`}
            >
              Newest
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setParams({ sort: "price-asc" })}
              className={`cursor-pointer hover:text-red-600 ${
                params.sort === "price-asc" ? "font-bold text-red-600" : ""
              }`}
            >
              Price: Low
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setParams({ sort: "price-desc" })}
              className={`cursor-pointer hover:text-red-600 ${
                params.sort === "price-desc" ? "font-bold text-red-600" : ""
              }`}
            >
              Price: High
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2 flex justify-between items-center">
        <span>
          {isLoading ? "Searching catalog..." : `Showing ${products.length} ${products.length === 1 ? "product" : "products"}`}
        </span>
        {(params.query || params.category !== "all" || params.sort !== "newest") && (
          <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs h-7">
            Reset Filters
          </Button>
        )}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xs:landscape:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 py-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse"
            />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xs:landscape:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductsCardDetails
              key={product.id || product.slug}
              id={product.id}
              name={product.name || product.title || ""}
              price={product.price}
              discount={product.discount}
              description={product.description || ""}
              slug={product.slug}
              mainImage={product.images?.[0] || "/fallback-image.webp"}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
          <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            No products found matching your search criteria.
          </p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Try checking for spelling errors, clearing category filters, or searching for broader cookware terms.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              Reset Filters & View All Products
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}