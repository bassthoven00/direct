"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type CartItem = { quantity: number };

export default function Navbar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const items: CartItem[] = JSON.parse(localStorage.getItem("cart_items") || "[]");
        setCartCount(items.reduce((s, i) => s + i.quantity, 0));
      } catch {
        setCartCount(0);
      }
    };
    
    // Read on mount and path change
    read();
    
    // Listen for storage changes across tabs
    window.addEventListener("storage", read);
    // Listen for custom event in the same tab
    window.addEventListener("cart_updated", read);
    
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("cart_updated", read);
    };
  }, [pathname]);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLink = (href: string, label: string, onClick?: () => void) => (
    <Link
      href={href}
      onClick={onClick}
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
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Direct<span className="text-purple-400">.</span>
          </Link>
        </div>

        {/* Desktop Nav links */}
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

      {/* Mobile Nav Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#0a0a0a] border-b border-white/10 shadow-2xl p-4 flex flex-col gap-4 z-40">
          <Link
            href="/experiences"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl ${pathname === "/experiences" ? "bg-white/10 text-white font-medium" : "text-gray-400 hover:bg-white/5"}`}
          >
            Experiences
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl ${pathname === "/shop" ? "bg-white/10 text-white font-medium" : "text-gray-400 hover:bg-white/5"}`}
          >
            Shop
          </Link>
        </div>
      )}
    </header>
  );
}
