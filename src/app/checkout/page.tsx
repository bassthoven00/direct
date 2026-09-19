"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// We'll define a type for our session data.
type CheckoutSession = {
  id: string;
  source: "cart" | "experience";
  items?: { id: string; name: string; price: number; quantity: number }[];
  experience?: { id: string; name: string; price: number };
  formData?: Record<string, string>;
  total: number;
  expiresAt: number;
  status: "active" | "submitted" | "expired";
  returnUrl: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("checkout_session");
    if (!stored) {
      router.push("/");
      return;
    }

    try {
      const parsedSession: CheckoutSession = JSON.parse(stored);
      
      if (parsedSession.status === "expired") {
        router.push(parsedSession.returnUrl);
        return;
      }

      setSession(parsedSession);
    } catch {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!session || session.status !== "active") return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        // Expire
        const updated = { ...session, status: "expired" as const };
        localStorage.setItem("checkout_session", JSON.stringify(updated));
        setSession(updated);
        router.push(session.returnUrl);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, router]);

  const handleCopy = () => {
    navigator.clipboard.writeText("123456789");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSentIt = async () => {
    if (!session || session.status !== "active") return;
    
    setIsSubmitting(true);
    // Simulate API call to backend payment confirmation
    await new Promise(r => setTimeout(r, 1500));
    
    const updated = { ...session, status: "submitted" as const };
    localStorage.setItem("checkout_session", JSON.stringify(updated));
    setSession(updated);
    setIsSubmitting(false);
  };

  if (!mounted || !session) return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeString = `${m}:${s < 10 ? "0" : ""}${s}`;

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12 pb-24">
        {session.status === "submitted" ? (
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-4">Payment Submitted</h1>
            <p className="text-gray-400 mb-8">
              We&apos;ve received your payment notification. Your {session.source === "cart" ? "order" : "booking"} is now awaiting confirmation.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("checkout_session");
                if (session.source === "cart") {
                  localStorage.removeItem("cart_items");
                }
                router.push("/");
              }}
              className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all"
            >
              Return Home
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>
            <div className="grid md:grid-cols-2 gap-12">
              
              {/* Left Column: Order Summary */}
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
                  {session.source === "cart" && session.items && (
                    <div className="space-y-4 mb-6">
                      {session.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="text-white font-medium">{item.name}</p>
                            <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-white font-bold">${((item.price * item.quantity) / 100).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {session.source === "experience" && session.experience && (
                    <div className="mb-6">
                      <div className="flex justify-between items-start border-b border-white/5 pb-4">
                        <div>
                          <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">Experience</p>
                          <p className="text-white font-medium text-lg">{session.experience.name}</p>
                        </div>
                        <p className="text-white font-bold text-lg">${(session.experience.price / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xl font-bold text-white pt-4 border-t border-white/10">
                    <span>Total Due</span>
                    <span>${(session.total / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Details */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Payment Details</h2>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                    <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">Expires in</span>
                    <span className="text-sm font-mono font-bold text-red-400">{timeString}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm text-gray-400 mb-6">
                    Please transfer exactly <strong className="text-white">${(session.total / 100).toFixed(2)}</strong> to the bank account below.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Bank Name</label>
                      <p className="text-white font-medium">Global Secure Bank</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Account Name</label>
                      <p className="text-white font-medium">Direct Platform LLC</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</label>
                      <div className="flex items-center gap-3">
                        <p className="text-white font-mono font-medium text-lg">123456789</p>
                        <button 
                          onClick={handleCopy}
                          className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white transition-colors"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Routing Number</label>
                      <p className="text-white font-mono font-medium">987654321</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-6">
                    <p className="text-orange-400 text-sm">
                      <strong className="block mb-1">Important:</strong> 
                      Only click &quot;I&apos;ve Sent It&quot; after you have actually completed the payment. Do not click this button before sending the payment.
                    </p>
                  </div>

                  <button
                    onClick={handleSentIt}
                    disabled={isSubmitting || session.status !== "active"}
                    className="w-full py-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Processing..." : "I've Sent It"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
