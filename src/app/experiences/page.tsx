"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EXPERIENCES = [
  {
    id: "exp-1",
    name: "Personalized Video Message",
    price: 12500,
    tag: "Most Popular",
    type: "Video",
    emoji: "🎬",
    delivery: "7 business days",
    description: "A heartfelt 30-second personalized video message for any occasion — birthdays, milestones, or just because.",
    fields: [
      { name: "recipientName", label: "Who is this for?", type: "text" },
      { name: "occasion", label: "Occasion", type: "select", options: ["Birthday", "Anniversary", "Graduation", "Pep Talk", "Roast", "Other"] },
      { name: "instructions", label: "Instructions (max 300 chars)", type: "textarea" },
    ],
  },
  {
    id: "exp-2",
    name: "Birthday Shoutout",
    price: 9000,
    tag: "Quick Delivery",
    type: "Video",
    emoji: "🎂",
    delivery: "3 business days",
    description: "Make someone's birthday completely unforgettable with a special shoutout.",
    fields: [
      { name: "recipientName", label: "Birthday person's name", type: "text" },
      { name: "age", label: "Turning how old? (optional)", type: "text" },
      { name: "instructions", label: "Anything special to mention?", type: "textarea" },
    ],
  },
  {
    id: "exp-3",
    name: "Custom Pep Talk",
    price: 19000,
    tag: "Motivation",
    type: "Video",
    emoji: "💪",
    delivery: "5 business days",
    description: "An exclusive motivational message crafted just for you or someone who needs a boost.",
    fields: [
      { name: "recipientName", label: "Who needs the pep talk?", type: "text" },
      { name: "challenge", label: "What challenge are they facing?", type: "textarea" },
    ],
  },
  {
    id: "exp-4",
    name: "Live Video Call",
    price: 37500,
    tag: "Premium",
    type: "Live",
    emoji: "📹",
    delivery: "Scheduled within 14 days",
    description: "A private 10-minute live video call. Ask questions, get advice, or just have a moment to remember.",
    fields: [
      { name: "recipientName", label: "Your name", type: "text" },
      { name: "topics", label: "What would you like to discuss?", type: "textarea" },
      { name: "preferredTime", label: "Preferred time slots (e.g. weekday evenings)", type: "text" },
    ],
  },
  {
    id: "exp-5",
    name: "Autographed Photo",
    price: 20000,
    tag: "Collectible",
    type: "Physical",
    emoji: "✍️",
    delivery: "10 business days",
    description: "An officially signed 8×10\" photograph with a personalized message, shipped in a protective sleeve.",
    fields: [
      { name: "recipientName", label: "Personalize to (name)", type: "text" },
      { name: "message", label: "Custom message request (optional)", type: "textarea" },
    ],
  },
  {
    id: "exp-6",
    name: "Fan Q&A Session",
    price: 10000,
    tag: "Exclusive",
    type: "Live",
    emoji: "🎤",
    delivery: "Scheduled within 21 days",
    description: "Submit your top 3 questions and get them personally answered in an exclusive video response.",
    fields: [
      { name: "q1", label: "Question 1", type: "text" },
      { name: "q2", label: "Question 2", type: "text" },
      { name: "q3", label: "Question 3 (optional)", type: "text" },
    ],
  },
];


const TYPES = ["All", "Video", "Live", "Physical"];

type FormData = Record<string, string>;

export default function ExperiencesPage() {
  const [activeType, setActiveType] = useState("All");
  const [selected, setSelected] = useState<typeof EXPERIENCES[0] | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [submitted, setSubmitted] = useState(false);

  const filtered = activeType === "All" ? EXPERIENCES : EXPERIENCES.filter((e) => e.type === activeType);

  const openModal = (exp: typeof EXPERIENCES[0]) => {
    setSelected(exp);
    setFormData({});
    setSubmitted(false);
  };

  const closeModal = () => {
    setSelected(null);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const session = {
      id: crypto.randomUUID(),
      source: "experience",
      experience: selected,
      formData: formData,
      total: selected.price,
      expiresAt: Date.now() + 15 * 60 * 1000,
      status: "active",
      returnUrl: "/experiences"
    };
    
    localStorage.setItem("checkout_session", JSON.stringify(session));
    window.location.href = "/checkout";
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
                <div className="text-6xl mb-4">🎉</div>
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
                    <p className="text-purple-400 font-bold text-lg">${(selected.price / 100).toFixed(2)}</p>
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
                          <option value="">Select…</option>
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
                          placeholder="Type here…"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          required
                          value={formData[field.name] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          placeholder="Type here…"
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
                <p className="text-xs text-gray-500 mb-4">⏱ Delivery: {exp.delivery}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-bold text-white">${(exp.price / 100).toFixed(2)}</span>
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
