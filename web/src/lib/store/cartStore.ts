import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ValidateCouponResponse } from "@/types";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  discount?: number;
}

interface CartState {
  items: CartItem[];
  coupon: ValidateCouponResponse | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  applyCoupon: (coupon: ValidateCouponResponse) => void;
  removeCoupon: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      clearCart: () => set({ items: [], coupon: null }),

      increaseQuantity: (id) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        });
      },

      decreaseQuantity: (id) => {
        set({
          items: get().items
            .map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item
            )
            .filter((item) => item.quantity > 0),
        });
      },

      applyCoupon: (coupon) => {
        set({ coupon });
      },

      removeCoupon: () => {
        set({ coupon: null });
      },

      getTotalPrice: () => {
        const subtotal = get().items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );
        const coupon = get().coupon;
        if (coupon && coupon.valid) {
          return Math.max(0, Math.round((subtotal - coupon.discountAmount) * 100) / 100);
        }
        const bulkDiscount = subtotal > 300 ? 0.1 * subtotal : 0;
        return Math.max(0, Math.round((subtotal - bulkDiscount) * 100) / 100);
      },

      getSubtotal: () => {
        return Math.round(
          get().items.reduce((acc, item) => acc + item.price * item.quantity, 0) * 100
        ) / 100;
      },

      getDiscount: () => {
        const subtotal = get().items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );
        const coupon = get().coupon;
        if (coupon && coupon.valid) {
          return coupon.discountAmount;
        }
        return subtotal > 300 ? Math.round(0.1 * subtotal * 100) / 100 : 0;
      },

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
