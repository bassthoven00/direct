"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PRODUCTS = [
  { id: "prod-1", name: "Signature Hoodie", category: "Apparel", price: 16500, description: "Premium heavyweight cotton hoodie with embroidered logo.", emoji: "👕", colors: ["Black", "White", "Purple"] },
  { id: "prod-2", name: "Classic Logo Tee", category: "Apparel", price: 9000, description: "Soft 100% organic cotton tee, pre-shrunk.", emoji: "👕", colors: ["Black", "White"] },
  { id: "prod-3", name: "Snapback Cap", category: "Accessories", price: 7000, description: "Adjustable snapback with embroidered logo.", emoji: "🧢", colors: ["Black", "Purple"] },
  { id: "prod-4", name: "Limited Art Print", category: "Collectibles", price: 11500, description: "Numbered limited edition 12\"x18\" art print, signed.", emoji: "🖼️", colors: ["Standard"] },
  { id: "prod-5", name: "Enamel Pin Set", category: "Accessories", price: 4000, description: "Set of 3 collectible enamel pins in a gift box.", emoji: "📌", colors: ["Standard"] },
  { id: "prod-6", name: "Autograph Poster", category: "Collectibles", price: 20000, description: "High-quality 18\"x24\" poster, hand-signed and shipped in a tube.", emoji: "📜", colors: ["Standard"] },
];

const CATEGORIES = ["All", "Apparel", "Accessories", "Collectibles"];

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "experience";
};

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = activeCategory === "All"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory);

  const addToCart = (product: typeof PRODUCTS[0]) => {
    const existing: CartItem[] = JSON.parse(localStorage.getItem("cart_items") || "[]");
    const idx = existing.findIndex((i) => i.id === product.id);
    if (idx >= 0) {
      existing[idx].quantity += 1;
    } else {
      existing.push({ id: product.id, name: product.name, price: product.price, quantity: 1, type: "product" });
    }
    localStorage.setItem("cart_items", JSON.stringify(existing));
    window.dispatchEvent(new Event("cart_updated"));
    
    setToast(`${product.name} added to cart!`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-600 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-purple-500/30 text-sm font-medium animate-bounce flex items-center gap-3">
          <span>🎉 {toast}</span>
          <Link href="/cart" className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs transition-colors">
            View Cart
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-700/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold tracking-wider uppercase">
            Official Merch
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">The Shop</h1>
          <p className="text-gray-400">Limited edition drops, signed collectibles, and premium apparel — ships worldwide.</p>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex gap-3 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-purple-600 text-white"
                  : "border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/10 flex flex-col"
            >
              {/* Image area */}
              <div className="h-52 bg-gradient-to-br from-purple-900/50 to-pink-900/30 flex flex-col items-center justify-center gap-2">
                <span className="text-6xl">{product.emoji}</span>
                <span className="text-xs text-gray-400 font-medium">{product.colors.join(" / ")}</span>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">{product.category}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{product.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-bold text-white">${(product.price / 100).toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all active:scale-95"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
