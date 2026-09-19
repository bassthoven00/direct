import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Gradient blob */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-purple-700/30 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-24 text-center relative z-10">
          <span className="inline-block mb-5 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold tracking-wider uppercase">
            Exclusive Access
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Direct Fan<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Experiences
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-gray-400 text-lg mb-10">
            Personalized video messages, exclusive merchandise, and once-in-a-lifetime moments — direct from the source.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/experiences"
              className="px-8 py-3.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-base transition-all shadow-lg shadow-purple-500/25"
            >
              Browse Experiences
            </Link>
            <Link
              href="/shop"
              className="px-8 py-3.5 rounded-full border border-white/20 hover:border-white/40 text-white font-semibold text-base transition-all"
            >
              Visit Shop
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Choose an Experience", desc: "Browse personalized video messages, shoutouts, live calls, and more." },
            { step: "02", title: "Fill in the Details", desc: "Tell us who it's for and any special instructions you'd like included." },
            { step: "03", title: "Receive & Share", desc: "Your personalized experience is delivered directly to your inbox." },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-purple-500/40 transition-colors">
              <span className="text-4xl font-black text-purple-500/30 leading-none">{item.step}</span>
              <h3 className="text-lg font-semibold text-white mt-3 mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Experiences ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Featured Experiences</h2>
          <Link href="/experiences" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Personalized Video Message", price: "$125", tag: "Most Popular", desc: "A heartfelt 30-second video for any occasion." },
            { name: "Birthday Shoutout", price: "$90", tag: "Quick Delivery", desc: "Make someone's birthday unforgettable." },
            { name: "Custom Pep Talk", price: "$190", tag: "Motivation", desc: "An exclusive motivational message crafted just for you." },
          ].map((pkg) => (
            <div key={pkg.name} className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/10">
              {/* Placeholder image area */}
              <div className="h-48 bg-gradient-to-br from-purple-900/50 to-pink-900/30 flex items-center justify-center">
                <span className="text-5xl">🌟</span>
              </div>
              <div className="p-6">
                <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">{pkg.tag}</span>
                <h3 className="text-white font-semibold mt-1 mb-2">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{pkg.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">{pkg.price}</span>
                  <Link href="/experiences" className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Merch Banner ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-900/40 to-pink-900/30 p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Official Merch Drop</h2>
            <p className="text-gray-400">Limited edition hoodies, tees, and accessories — ships worldwide.</p>
          </div>
          <Link
            href="/shop"
            className="flex-shrink-0 px-8 py-3 rounded-full border border-purple-400/50 hover:bg-purple-600 text-white font-semibold transition-all"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">What Fans Are Saying</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "Absolutely incredible. The video made my daughter cry happy tears on her birthday!", author: "Sarah M." },
            { quote: "Got my husband a pep talk for his marathon. He watched it 10 times before the race.", author: "James T." },
            { quote: "Super easy to order and delivered so fast. Will definitely be back.", author: "Priya K." },
          ].map((t) => (
            <div key={t.author} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-gray-300 text-sm leading-relaxed mb-4">&quot;{t.quote}&quot;</p>
              <span className="text-purple-400 font-semibold text-sm">— {t.author}</span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
