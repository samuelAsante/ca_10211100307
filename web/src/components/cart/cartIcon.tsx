"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import { FaShoppingCart } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Props {
  className?: string;
  onClick?: () => void;
  noLink?: boolean;
}

export const CartIcon = ({ className, noLink, onClick }: Props) => {
  const itemCount = useCartStore((state) => state.getItemCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Content = () => (
    <>
      <FaShoppingCart className="text-xl" aria-hidden="true" />
      {mounted && itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
          {itemCount}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`View cart${mounted && itemCount > 0 ? `, ${itemCount} item${itemCount > 1 ? "s" : ""}` : ""}`}
        className={cn("relative bg-transparent border-0 cursor-pointer p-0", className)}
      >
        <Content />
      </button>
    );
  }

  if (noLink) {
    return (
      <div className={cn("relative", className)}>
        <Content />
      </div>
    );
  }

  return (
    <Link
      href="/cart"
      aria-label={`View cart${mounted && itemCount > 0 ? `, ${itemCount} item${itemCount > 1 ? "s" : ""}` : ""}`}
      className={cn("relative", className)}
    >
      <Content />
    </Link>
  );
};
