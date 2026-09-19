"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type CartItem = { quantity: number };

export default function Navbar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const read = () => {
      try {
        const items: CartItem[] = JSON.parse(localStorage.getItem("cart_items") || "[]");
        setCartCount(items.reduce((s, i) => s + i.quantity, 0));
      } catch {
        setCartCount(0);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, [pathname]);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`transition-colors text-sm ${
        pathname === href ? "text-white font-medium" : "text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Direct<span className="text-purple-400">.</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLink("/experiences", "Experiences")}
          {navLink("/shop", "Shop")}
        </nav>

        {/* Cart */}
        <Link
          href="/cart"
          className="relative flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
