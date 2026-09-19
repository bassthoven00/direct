import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24 py-12 text-center text-sm text-gray-500">
      <p>&copy; {new Date().getFullYear()} Direct. All rights reserved.</p>
      <div className="mt-4 flex justify-center gap-6">
        <Link href="/" className="hover:text-gray-300 transition-colors">Terms</Link>
        <Link href="/" className="hover:text-gray-300 transition-colors">Privacy</Link>
        <Link href="/" className="hover:text-gray-300 transition-colors">Contact</Link>
      </div>
    </footer>
  );
}
