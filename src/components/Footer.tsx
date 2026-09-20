import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/8 mt-24 py-14 text-center">
      <div className="max-w-6xl mx-auto px-4">
        {/* Logo */}
        <p className="text-xl font-bold text-white mb-1">
          Direct<span className="text-purple-400">.</span>
        </p>
        <p className="text-xs text-gray-600 mb-6">Your direct connection to unforgettable fan experiences.</p>

        {/* Links */}
        <div className="flex justify-center gap-6 mb-8 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">Terms</Link>
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy</Link>
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">Contact</Link>
          <Link href="/experiences" className="text-gray-500 hover:text-gray-300 transition-colors">Experiences</Link>
          <Link href="/shop" className="text-gray-500 hover:text-gray-300 transition-colors">Shop</Link>
        </div>

        <div className="border-t border-white/8 pt-6">
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Direct. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
