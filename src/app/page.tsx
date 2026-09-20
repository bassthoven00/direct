"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-purple-700/25 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[400px] bg-pink-700/15 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-24 text-center relative z-10 w-full">
          <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Exclusive Access
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Direct Fan<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
              Experiences
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-gray-400 text-lg mb-10 leading-relaxed">
            Personalized video messages, exclusive merchandise, and once-in-a-lifetime moments — direct from the source.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link
              href="/experiences"
              className="px-8 py-3.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-base transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
            >
              Browse Experiences
            </Link>
            <Link
              href="/shop"
              className="px-8 py-3.5 rounded-full border border-white/20 hover:border-purple-400/60 hover:bg-white/5 text-white font-semibold text-base transition-all hover:scale-105"
            >
              Visit Shop
            </Link>
          </div>

          {/* Stats bar */}
          <div className="inline-flex flex-wrap justify-center gap-8 px-8 py-5 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm">
            {[
              { value: "500+", label: "Happy Fans" },
              { value: "100%", label: "Authentic" },
              { value: "6", label: "Experience Types" },
              { value: "48h", label: "Avg. Delivery" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3 block">Simple Process</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line on desktop */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          {[
            { step: "01", title: "Choose an Experience", desc: "Browse personalized video messages, shoutouts, live calls, and more.", icon: "🎯" },
            { step: "02", title: "Fill in the Details", desc: "Tell us who it's for and any special instructions you'd like included.", icon: "✍️" },
            { step: "03", title: "Receive & Share", desc: "Your personalized experience is delivered directly to your inbox.", icon: "🎁" },
          ].map((item) => (
            <div key={item.step} className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/3 p-8 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="text-xs font-black text-purple-500/50 tracking-widest">{item.step}</span>
              <h3 className="text-lg font-semibold text-white mt-2 mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Experiences ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-1 block">Top Picks</span>
            <h2 className="text-3xl font-bold text-white">Featured Experiences</h2>
          </div>
          <Link href="/experiences" className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">
            View all <span className="text-base">→</span>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Personalized Video Message", price: "$125", tag: "Most Popular", desc: "A heartfelt 1-minute video for any occasion.", emoji: "🎥", hot: true },
            { name: "Birthday Shoutout", price: "$90", tag: "Quick Delivery", desc: "Make someone's birthday unforgettable.", emoji: "🎂", hot: false },
            { name: "Custom Pep Talk", price: "$190", tag: "Motivation", desc: "An exclusive motivational message crafted just for you.", emoji: "🔥", hot: false },
          ].map((pkg) => (
            <div key={pkg.name} className="group relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/15 hover:-translate-y-1">
              {pkg.hot && (
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  🔥 Hot
                </div>
              )}
              <div className="h-48 bg-gradient-to-br from-purple-900/60 to-pink-900/40 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className="text-5xl relative z-10 group-hover:scale-110 transition-transform duration-300">{pkg.emoji}</span>
                <span className="text-xs text-purple-300 font-medium px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 relative z-10">{pkg.tag}</span>
              </div>
              <div className="p-6">
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-purple-200 transition-colors">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">{pkg.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-white">{pkg.price}</span>
                  <Link href="/experiences" className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-500/20">
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Merch Banner ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-pink-900/50" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl" />
          <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2 block">Limited Drops</span>
              <h2 className="text-3xl font-bold text-white mb-2">Official Merch Drop</h2>
              <p className="text-gray-400 max-w-sm">Limited edition hoodies, tees, and accessories — ships worldwide. Grab yours before it sells out.</p>
            </div>
            <Link
              href="/shop"
              className="flex-shrink-0 px-8 py-3.5 rounded-full bg-white text-black font-bold transition-all hover:bg-purple-100 hover:scale-105 shadow-xl"
            >
              Shop Now →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3 block">Social Proof</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">What Fans Are Saying</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "Absolutely incredible. The video made my daughter cry happy tears on her birthday!", author: "Sarah M.", stars: 5 },
            { quote: "Got my husband a pep talk for his marathon. He watched it 10 times before the race.", author: "James T.", stars: 5 },
            { quote: "Super easy to order and delivered so fast. Will definitely be back.", author: "Priya K.", stars: 5 },
          ].map((t) => (
            <div key={t.author} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-purple-500/30 transition-all hover:bg-white/8">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {t.author[0]}
                </div>
                <span className="text-purple-400 font-semibold text-sm">{t.author}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
