export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24 py-12 text-center text-sm text-gray-500">
      <p>© {new Date().getFullYear()} Direct. All rights reserved.</p>
      <div className="mt-4 flex justify-center gap-6">
        <a href="/terms" className="hover:text-gray-300 transition-colors">Terms</a>
        <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</a>
        <a href="/contact" className="hover:text-gray-300 transition-colors">Contact</a>
      </div>
    </footer>
  );
}
