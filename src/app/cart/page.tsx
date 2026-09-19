"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "experience";
};

const SHIPPING_THRESHOLD = 10000; // $100.00 in cents
const SHIPPING_COST = 899;        // $8.99 in cents

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("cart_items");
    if (stored) setItems(JSON.parse(stored));
  }, []);

  const persist = useCallback((updated: CartItem[]) => {
    setItems(updated);
    localStorage.setItem("cart_items", JSON.stringify(updated));
  }, []);

  const updateQty = (id: string, delta: number) => {
    const updated = items
      .map((i) => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
      .filter((i) => i.quantity > 0);
    persist(updated);
  };

  const remove = (id: string) => {
    persist(items.filter((i) => i.id !== id));
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const hasPhysical = items.some((i) => i.type === "product");
  const shipping = hasPhysical && subtotal < SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  if (!mounted) return null;

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-10">Your Cart</h1>

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="text-center py-24">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-white mb-3">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Add something to get started.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/shop" className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all">
                Browse Shop
              </Link>
              <Link href="/experiences" className="px-8 py-3 rounded-full border border-white/20 hover:border-white/40 text-white font-semibold transition-all">
                View Experiences
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Items list ── */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4 items-center">
                  {/* Icon placeholder */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-900/60 to-pink-900/40 flex items-center justify-center flex-shrink-0 text-2xl">
                    {item.type === "experience" ? "🌟" : "📦"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{item.name}</p>
                    <p className="text-sm text-gray-400 capitalize">{item.type}</p>
                    <p className="text-purple-400 font-bold mt-1">${(item.price / 100).toFixed(2)}</p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-colors flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-white font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <p className="text-white font-bold w-20 text-right">
                    ${((item.price * item.quantity) / 100).toFixed(2)}
                  </p>

                  {/* Remove */}
                  <button
                    onClick={() => remove(item.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-white mb-6">Order Summary</h2>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="text-white">${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-green-400" : "text-white"}>
                      {shipping === 0 ? "Free" : `$${(shipping / 100).toFixed(2)}`}
                    </span>
                  </div>
                  {hasPhysical && subtotal < SHIPPING_THRESHOLD && (
                    <p className="text-xs text-gray-500">
                      Add ${((SHIPPING_THRESHOLD - subtotal) / 100).toFixed(2)} more for free shipping
                    </p>
                  )}
                  <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-base">
                    <span>Total</span>
                    <span>${(total / 100).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const session = {
                      id: crypto.randomUUID(),
                      source: "cart",
                      items: items,
                      total: total,
                      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
                      status: "active",
                      returnUrl: "/cart"
                    };
                    localStorage.setItem("checkout_session", JSON.stringify(session));
                    window.location.href = "/checkout";
                  }}
                  className="block w-full text-center py-3.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/shop"
                  className="block w-full text-center mt-3 py-3 rounded-full border border-white/10 hover:border-white/20 text-gray-400 hover:text-white text-sm font-medium transition-all"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
