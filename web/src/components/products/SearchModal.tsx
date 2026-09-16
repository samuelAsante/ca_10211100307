"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProducts } from "@/hooks/use-products";
import { useDebounce } from "@/hooks/use-debounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconSearch, IconArrowRight } from "@tabler/icons-react";

export function SearchModal({
  isOpen,
  onClose,
  placeholder = "Search cookware, frying pans, blenders...",
}: {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm.trim(), 300);
  const router = useRouter();

  const { data: products = [], isLoading } = useProducts(
    debouncedSearch.length >= 2 ? { search: debouncedSearch, limit: 6 } : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    onClose();
    setSearchTerm("");
  };

  const handleSelectProduct = (slug: string) => {
    onClose();
    router.push(`/products/${slug}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden z-50">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-base font-semibold">Search Ashanti&apos;s Kitchenware</DialogTitle>
        </DialogHeader>

        {/* Search Input Field */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="pl-9 h-11 text-sm bg-neutral-50 dark:bg-neutral-900"
              />
            </div>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white h-11 px-4">
              Search
            </Button>
          </form>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-4 space-y-2">
          {isLoading && debouncedSearch.length >= 2 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Searching cookware catalog...
            </div>
          ) : debouncedSearch.length >= 2 && products.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No matching cookware found for &quot;{debouncedSearch}&quot;
              </p>
              <p className="text-xs text-neutral-400">
                Try searching for pots, non-stick, granite, or knife sets.
              </p>
            </div>
          ) : products.length > 0 && debouncedSearch.length >= 2 ? (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
                Suggested Products
              </span>
              {products.slice(0, 6).map((product) => (
                <div
                  key={product.id || product.slug}
                  onClick={() => handleSelectProduct(product.slug)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 relative rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                      <Image
                        src={product.images?.[0] || "/fallback-image.webp"}
                        alt={product.name || "Product"}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      {product.category && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 mt-0.5">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="text-sm font-bold text-red-600">
                      GH₵ {product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-neutral-400 space-y-1">
              <p>Type at least 2 characters to search.</p>
              <p className="text-[11px] text-neutral-500">Popular: Cookware Sets, Frying Pan, Granite Pots</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {debouncedSearch.length >= 2 && products.length > 0 && (
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 text-center">
            <Link
              href={`/search?query=${encodeURIComponent(debouncedSearch)}`}
              onClick={onClose}
              className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
            >
              View all results for &quot;{debouncedSearch}&quot;
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
