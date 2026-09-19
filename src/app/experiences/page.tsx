"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EXPERIENCES = [
  {
    id: "exp-1",
    name: "Personalized Video Message",
    type: "Digital",
    tag: "Most Popular",
    price: 12500,
    delivery: "3-5 days",
    emoji: "🎥",
    description: "Get a custom 1-minute video shoutout for a birthday, pep talk, or roast.",
    fields: [
      { name: "forWho", label: "Who is this for?", type: "text" },
      { name: "occasion", label: "Occasion", type: "select", options: ["Birthday", "Pep Talk", "Roast", "Other"] },
      { name: "instructions", label: "Instructions / Details", type: "textarea" }
    ]
  },
  {
    id: "exp-2",
    name: "Birthday Shoutout",
    type: "Digital",
    tag: "Quick Turnaround",
    price: 9000,
    delivery: "48 hours",
    emoji: "🎂",
    description: "A quick, energetic happy birthday video message.",
    fields: [
      { name: "name", label: "Name of Birthday Person", type: "text" },
      { name: "age", label: "Age turning (optional)", type: "text" }
    ]
  },
  {
    id: "exp-3",
    name: "Pep Talk",
    type: "Digital",
    tag: "Motivation",
    price: 19000,
    delivery: "3-5 days",
    emoji: "🔥",
    description: "Need some motivation? Get a personalized hype video before a big game or event.",
    fields: [
      { name: "event", label: "What's the big event?", type: "text" },
      { name: "focus", label: "What should I focus on?", type: "textarea" }
    ]
  },
  {
    id: "exp-4",
    name: "1-on-1 Live Call",
    type: "Live",
    tag: "VIP",
    price: 37500,
    delivery: "Scheduled",
    emoji: "📱",
    description: "A private 10-minute video call via Zoom or FaceTime.",
    fields: [
      { name: "topic", label: "What do you want to talk about?", type: "textarea" },
      { name: "platform", label: "Preferred Platform", type: "select", options: ["Zoom", "FaceTime", "Google Meet"] }
    ]
  },
  {
    id: "exp-5",
    name: "Autographed Photo",
    type: "Physical",
    tag: "Collectible",
    price: 20000,
    delivery: "2-3 weeks",
    emoji: "📸",
    description: "An official 8x10 glossy photo, hand-signed and personalized with a short message.",
    fields: [
      { name: "name", label: "Who should I make it out to?", type: "text" },
      { name: "message", label: "Short custom message (optional)", type: "text" }
    ]
  },
  {
    id: "exp-6",
    name: "Fan Q&A",
    type: "Digital",
    tag: "Interactive",
    price: 10000,
    delivery: "1 week",
    emoji: "💬",
    description: "Submit up to 3 questions and get a detailed video answering them.",
    fields: [
      { name: "q1", label: "Question 1", type: "text" },
      { name: "q2", label: "Question 2", type: "text" },
      { name: "q3", label: "Question 3 (optional)", type: "text" }
    ]
  }
];

const TYPES = ["All", "Digital", "Live", "Physical"];

export default function ExperiencesPage() {
  const [activeType, setActiveType] = useState("All");
  const [selected, setSelected] = useState<typeof EXPERIENCES[0] | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const filtered = activeType === "All"
    ? EXPERIENCES
    : EXPERIENCES.filter((e) => e.type === activeType);

  const openModal = (exp: typeof EXPERIENCES[0]) => {
    setSelected(exp);
    setFormData({});
    setSubmitted(false);
  };

  const closeModal = () => {
    setSelected(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const session = {
      id: crypto.randomUUID(),
      source: "experience",
      experience: {
        id: selected.id,
        name: selected.name,
        price: selected.price,
        formData
      },
      total: selected.price,
      status: "active",
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
      returnUrl: "/experiences"
    };
    
    localStorage.setItem("checkout_session", JSON.stringify(session));
    router.push("/checkout");
  };

  return (
    <>
      <Navbar />

      {/* Modal backdrop */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-[#111] border border-white/10 rounded-3xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-white mb-3">Request Submitted!</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Your booking for <strong className="text-white">{selected.name}</strong> has been received. You&apos;ll get a confirmation email shortly.
                </p>
                <button
                  onClick={closeModal}
                  className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">{selected.emoji}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selected.name}</h3>
                    <p className="text-purple-400 font-bold text-lg">${(selected.price / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                  </div>
                  <button onClick={closeModal} className="ml-auto text-gray-500 hover:text-white text-xl transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {selected.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm text-gray-400 mb-1.5">{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          required
                          value={formData[field.name] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt} className="bg-[#111]">{opt}</option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          required
                          rows={3}
                          maxLength={300}
                          value={formData[field.name] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          placeholder="Type here..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          required
                          value={formData[field.name] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          placeholder="Type here..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
                  >
                    Continue to Checkout
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-700/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold tracking-wider uppercase">
            Exclusive Access
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Fan Experiences</h1>
          <p className="text-gray-400">Choose a personalized experience and make a memory that lasts forever.</p>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex gap-3 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeType === t
                  ? "bg-purple-600 text-white"
                  : "border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Experiences Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/10 flex flex-col"
            >
              <div className="h-48 bg-gradient-to-br from-purple-900/50 to-pink-900/30 flex flex-col items-center justify-center gap-2">
                <span className="text-6xl">{exp.emoji}</span>
                <span className="text-xs text-gray-400 font-medium px-3 py-1 rounded-full bg-white/10">{exp.type}</span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">{exp.tag}</span>
                <h3 className="text-white font-semibold text-lg mb-2">{exp.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-3 flex-1">{exp.description}</p>
                <p className="text-xs text-gray-500 mb-4">⏱️ Delivery: {exp.delivery}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-bold text-white">${(exp.price / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                  <button
                    onClick={() => openModal(exp)}
                    className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all active:scale-95"
                  >
                    Book Now
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
