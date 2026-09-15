'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import RestaurantNavbar from '../../components/RestaurantNavbar';

export default function AIDealMaker() {
  const router = useRouter();
  const [priceRange, setPriceRange]         = useState(5000);
  const [loading, setLoading]               = useState(true);
  const [deals, setDeals]                   = useState<any[]>([]);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [editingIdx, setEditingIdx]         = useState<number | null>(null);
  const [tempPrice, setTempPrice]           = useState('');
  const [activatingIdx, setActivatingIdx]   = useState<number | null>(null);
  const [toast, setToast]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      if (!ClientAuth.isAuthenticated()) { router.push('/restaurent'); return; }
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const generateDeals = async () => {
    setIsGenerating(true);
    try {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/generate-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
        body: JSON.stringify({ budget: priceRange }),
      });
      const result = await res.json();
      if (result.success) setDeals(result.deals);
      else setToast({ type: 'error', text: result.error || 'Failed to generate deals' });
    } catch { setToast({ type: 'error', text: 'Network error' }); }
    finally { setIsGenerating(false); }
  };

  const updatePrice = (idx: number) => {
    const val = parseFloat(tempPrice);
    if (isNaN(val) || val <= 0) { setToast({ type: 'error', text: 'Enter a valid price' }); return; }
    setDeals(prev => prev.map((d, i) => {
      if (i !== idx) return d;
      const savings = Math.max(0, d.originalPrice - val);
      return { ...d, dealPrice: val, savings, savingsPercentage: d.originalPrice > 0 ? Math.round((savings / d.originalPrice) * 100) : 0 };
    }));
    setEditingIdx(null);
  };

  const activateDeal = async (idx: number) => {
    setActivatingIdx(idx);
    try {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const deal = deals[idx];
      const res = await fetch('/api/activate-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
        body: JSON.stringify({ dealData: { dealName: deal.dealName, description: deal.description, originalPrice: deal.originalPrice, dealPrice: deal.dealPrice, items: deal.items } }),
      });
      const result = await res.json();
      if (result.success) {
        setDeals(prev => prev.map((d, i) => i === idx ? { ...d, isActivated: true, dealId: result.dealId } : d));
        setToast({ type: 'success', text: `"${deal.dealName}" activated!` });
      } else setToast({ type: 'error', text: result.error || 'Failed to activate deal' });
    } catch { setToast({ type: 'error', text: 'Network error' }); }
    finally { setActivatingIdx(null); }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
      <span className="h-12 w-12 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <RestaurantNavbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className={`fixed left-1/2 top-5 z-[2000] -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl ${
              toast.type === 'success' ? 'border-[#90CD1D]/40 bg-[#1D2D00] text-[#D6F0A4]' : 'border-red-300 bg-red-600 text-white'
            }`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-10 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="relative">
            <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
              Promotions Studio
            </span>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">AI Deal Maker</h1>
            <p className="mt-1 text-sm text-white/50">Generate and activate high-converting bundle deals in seconds.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

          {/* ── Left: budget control ──────────────────────────────────── */}
          <div className="lg:sticky lg:top-6 lg:h-fit space-y-5">
            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-[#1D2D00]">Budget Target</h2>
              <p className="mb-5 text-xs text-[#1D2D00]/50">Set the maximum deal price for AI to work within.</p>

              {/* Price display */}
              <div className="mb-5 rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Budget</p>
                <p className="mt-1 text-4xl font-black text-[#1D2D00]">PKR {priceRange.toLocaleString()}</p>
              </div>

              {/* Slider */}
              <div className="mb-1.5 flex justify-between text-xs text-[#1D2D00]/40">
                <span>PKR 500</span>
                <span>PKR 10,000</span>
              </div>
              <input type="range" min="500" max="10000" step="100" value={priceRange}
                onChange={e => setPriceRange(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-[#1D2D00]" />

              {/* Quick presets */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[1000, 2500, 5000].map(v => (
                  <button key={v} onClick={() => setPriceRange(v)}
                    className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                      priceRange === v ? 'bg-[#1D2D00] text-white' : 'border border-[#C8DFA0] bg-[#F0F4E8] text-[#386641] hover:bg-[#E8F0D7]'
                    }`}>
                    PKR {v.toLocaleString()}
                  </button>
                ))}
              </div>

              <button onClick={generateDeals} disabled={isGenerating}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D2D00] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#386641] disabled:opacity-50">
                {isGenerating
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating…</>
                  : <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>Generate AI Deals</>}
              </button>
            </div>

            {deals.length > 0 && (
              <div className="rounded-2xl border border-[#E8F0D7] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Summary</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1D2D00]/60">Deals generated</span>
                    <span className="font-bold text-[#1D2D00]">{deals.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1D2D00]/60">Activated</span>
                    <span className="font-bold text-[#386641]">{deals.filter(d => d.isActivated).length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: generated deals ────────────────────────────────── */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#1D2D00]">Generated Deals</h2>
              {deals.length > 0 && (
                <span className="rounded-full bg-[#E8F0D7] px-3 py-1 text-xs font-semibold text-[#386641]">
                  {deals.length} deal{deals.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {deals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#C8DFA0] bg-white p-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7]">
                  <svg className="h-8 w-8 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="font-bold text-[#1D2D00]">No deals generated yet</p>
                <p className="mt-1 text-sm text-[#1D2D00]/50">Set your budget and click Generate AI Deals.</p>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {deals.map((deal, idx) => (
                  <motion.article key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.06 }}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                      deal.isActivated ? 'border-[#90CD1D]/40' : 'border-[#E8F0D7]'
                    }`}>

                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3 border-b border-[#E8F0D7] p-5">
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate font-bold text-[#1D2D00]">{deal.dealName}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-[#1D2D00]/60">{deal.description}</p>
                      </div>
                      {deal.savingsPercentage > 0 && (
                        <span className="shrink-0 rounded-full bg-[#90CD1D] px-2.5 py-1 text-xs font-bold text-[#1D2D00]">
                          {deal.savingsPercentage}% OFF
                        </span>
                      )}
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Items */}
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Includes</p>
                        <div className="space-y-1.5">
                          {deal.items?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] px-3 py-2 text-sm">
                              <span className="font-medium text-[#1D2D00]">{item.name}</span>
                              <span className="text-xs text-[#1D2D00]/50">PKR {Number(item.price).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] p-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-[#1D2D00]/50">Original Price</span>
                          <span className="text-[#1D2D00]/40 line-through">PKR {Number(deal.originalPrice).toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#1D2D00]">Deal Price</span>
                          {editingIdx === idx ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center rounded-xl border border-[#C8DFA0] bg-white px-3 py-1.5">
                                <span className="mr-1.5 text-xs font-bold text-[#386641]">PKR</span>
                                <input type="number" value={tempPrice} onChange={e => setTempPrice(e.target.value)}
                                  className="w-20 bg-transparent text-sm font-bold text-[#1D2D00] outline-none"
                                  step="1" min="0" autoFocus />
                              </div>
                              <button onClick={() => updatePrice(idx)}
                                className="rounded-xl bg-[#1D2D00] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#386641]">
                                Save
                              </button>
                              <button onClick={() => setEditingIdx(null)}
                                className="rounded-xl border border-[#C8DFA0] px-3 py-1.5 text-xs font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-[#1D2D00]">PKR {Number(deal.dealPrice).toLocaleString()}</span>
                              <button onClick={() => { setEditingIdx(idx); setTempPrice(deal.dealPrice.toString()); }}
                                className="rounded-xl border border-[#C8DFA0] px-2.5 py-1 text-xs font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                                Edit
                              </button>
                            </div>
                          )}
                        </div>

                        {deal.savings > 0 && (
                          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#E8F0D7] px-3 py-2">
                            <span className="text-xs font-semibold text-[#386641]">Customer saves</span>
                            <span className="text-sm font-black text-[#386641]">
                              PKR {Number(deal.savings).toLocaleString()} ({deal.savingsPercentage}% off)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Activate */}
                      <button onClick={() => activateDeal(idx)}
                        disabled={activatingIdx === idx || deal.isActivated}
                        className={`w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                          deal.isActivated
                            ? 'bg-[#E8F0D7] text-[#386641] cursor-default'
                            : 'bg-[#1D2D00] text-white hover:bg-[#386641]'
                        }`}>
                        {activatingIdx === idx
                          ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Activating…</span>
                          : deal.isActivated ? '✓ Deal Activated' : 'Activate This Deal'}
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
