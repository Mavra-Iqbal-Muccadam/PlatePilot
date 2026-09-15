'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../src/components/Navbar';

interface Deal {
  id: number;
  deal_name: string;
  description: string;
  original_price: number;
  deal_price: number;
  current_uses: number;
  total_calories: number;
  created_at: string;
  restaurant: { id: number; name: string; profile_pic?: string };
  items: Array<{ food_name: string; quantity: number }>;
  savings: number;
  savingsPercentage: number;
}

const dealImages = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80',
];

const getDealImage = (id: number) => dealImages[id % dealImages.length];

// ── Favourites helpers ────────────────────────────────────────────────────
const FAV_KEY = 'favouriteDeals';
export function getFavourites(): Deal[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}
export function toggleFavourite(deal: Deal): boolean {
  const favs = getFavourites();
  const idx = favs.findIndex(f => f.id === deal.id);
  if (idx >= 0) { favs.splice(idx, 1); localStorage.setItem(FAV_KEY, JSON.stringify(favs)); return false; }
  favs.push(deal); localStorage.setItem(FAV_KEY, JSON.stringify(favs)); return true;
}
export function isFavourite(id: number): boolean {
  return getFavourites().some(f => f.id === id);
}

function SavingsBadge({ pct }: { pct: number }) {
  if (pct <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#90CD1D] px-2.5 py-1 text-xs font-bold text-[#1D2D00]">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      {pct}% OFF
    </span>
  );
}

export default function BrowseDeals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'savings' | 'price_asc' | 'price_desc' | 'default'>('default');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [favourites, setFavourites] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Get userId
    try {
      const ud = localStorage.getItem('userData');
      if (ud) setUserId(JSON.parse(ud).id);
    } catch { /* ignore */ }

    // Load favourites from localStorage as fallback
    setFavourites(new Set(getFavourites().map(f => f.id)));

    fetch('/api/public-deals')
      .then(r => r.json())
      .then(result => { if (result.success) setDeals(result.deals); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Sync favourites from API when userId is known
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/user-favourites?userId=${userId}`)
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          setFavourites(new Set(result.favourites.map((f: any) => f.id)));
        }
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFavourite = async (deal: Deal) => {
    const isNowFav = !favourites.has(deal.id);
    // Optimistic update
    const next = new Set(favourites);
    if (isNowFav) next.add(deal.id); else next.delete(deal.id);
    setFavourites(next);
    setToast(isNowFav ? `"${deal.deal_name}" added to favourites` : `"${deal.deal_name}" removed from favourites`);

    if (userId) {
      // Persist to API
      if (isNowFav) {
        await fetch('/api/user-favourites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, dealId: deal.id }) });
      } else {
        await fetch(`/api/user-favourites?userId=${userId}&dealId=${deal.id}`, { method: 'DELETE' });
      }
    } else {
      // Fallback to localStorage
      toggleFavourite(deal);
    }
    window.dispatchEvent(new Event('favouritesUpdated'));
  };

  const filtered = useMemo(() => {
    let list = deals.filter(d =>
      !search ||
      d.deal_name.toLowerCase().includes(search.toLowerCase()) ||
      d.restaurant.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === 'savings')    list = [...list].sort((a, b) => b.savingsPercentage - a.savingsPercentage);
    if (sortBy === 'price_asc')  list = [...list].sort((a, b) => a.deal_price - b.deal_price);
    if (sortBy === 'price_desc') list = [...list].sort((a, b) => b.deal_price - a.deal_price);
    return list;
  }, [deals, search, sortBy]);

  const totalSavings = deals.reduce((s, d) => s + d.savings, 0);

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed left-1/2 top-5 z-[2000] -translate-x-1/2 rounded-2xl border border-[#90CD1D]/40 bg-[#1D2D00] px-5 py-3 text-sm font-semibold text-[#D6F0A4] shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-12 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#D6F0A4]/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                Active Deals
              </span>
              <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Browse Deals</h1>
              <p className="mt-3 max-w-xl text-base text-white/60">
                Exclusive bundles from our partner restaurants. Save big on your favourite healthy meals.
              </p>
            </div>

            {/* Quick stats */}
            {!loading && deals.length > 0 && (
              <div className="flex shrink-0 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-[#90CD1D]">{deals.length}</p>
                  <p className="text-xs text-white/50">Active Deals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-[#90CD1D]">PKR {Math.round(totalSavings / deals.length).toLocaleString()}</p>
                  <p className="text-xs text-white/50">Avg. Saving</p>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-6 flex max-w-lg items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <svg className="h-4 w-4 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search deals or restaurants…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none" />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/40 hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#1D2D00]/50">
            Showing <span className="font-semibold text-[#1D2D00]">{filtered.length}</span> deal{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#1D2D00]/40">Sort by</span>
            {([
              { value: 'default',    label: 'Default'     },
              { value: 'savings',    label: 'Best Savings' },
              { value: 'price_asc',  label: 'Price ↑'     },
              { value: 'price_desc', label: 'Price ↓'     },
            ] as const).map(opt => (
              <button key={opt.value} onClick={() => setSortBy(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  sortBy === opt.value
                    ? 'bg-[#1D2D00] text-white'
                    : 'border border-[#C8DFA0] bg-white text-[#386641] hover:bg-[#E8F0D7]'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="mt-16 flex justify-center">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
          </div>
        )}

        {/* ── Empty ────────────────────────────────────────────────────── */}
        {!loading && filtered.length === 0 && (
          <div className="mt-10 rounded-3xl border border-[#E8F0D7] bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7]">
              <svg className="h-8 w-8 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1D2D00]">No deals found</h3>
            <p className="mt-1 text-sm text-[#1D2D00]/50">
              {search ? 'Try a different search term.' : 'No active deals at the moment.'}
            </p>
          </div>
        )}

        {/* ── Deal cards ───────────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((deal, i) => (
              <motion.article
                key={deal.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.2) }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8F0D7] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(29,45,0,0.12)]"
              >
                {/* Cover image */}
                <div className="relative h-44 w-full overflow-hidden bg-[#E8F0D7]">
                  <img src={getDealImage(deal.id)} alt={deal.deal_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {/* Overlay badges */}
                  <div className="absolute left-3 top-3">
                    <SavingsBadge pct={deal.savingsPercentage} />
                  </div>
                  {deal.total_calories > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#1D2D00]/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {deal.total_calories} kcal
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  {/* Restaurant */}
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#C8DFA0] bg-[#E8F0D7]">
                      {deal.restaurant.profile_pic ? (
                        <img src={deal.restaurant.profile_pic} alt={deal.restaurant.name}
                          className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#386641] to-[#1D2D00]">
                          <span className="text-xs font-bold text-white">{deal.restaurant.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => router.push(`/view-restaurant-menu?id=${deal.restaurant.id}`)}
                      className="text-xs font-semibold text-[#386641] hover:underline">
                      {deal.restaurant.name}
                    </button>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-lg font-bold text-[#1D2D00] leading-tight">{deal.deal_name}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#1D2D00]/60 line-clamp-2">{deal.description}</p>

                  {/* Included items — collapsible */}
                  {deal.items.length > 0 && (
                    <div className="mt-3">
                      <button onClick={() => setExpandedId(expandedId === deal.id ? null : deal.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#386641] hover:text-[#1D2D00]">
                        <svg className={`h-3.5 w-3.5 transition-transform ${expandedId === deal.id ? 'rotate-90' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {deal.items.length} item{deal.items.length !== 1 ? 's' : ''} included
                      </button>
                      <AnimatePresence>
                        {expandedId === deal.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-1.5">
                              {deal.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-xl bg-[#F0F4E8] px-3 py-2 text-xs">
                                  <span className="font-medium text-[#1D2D00]">{item.food_name}</span>
                                  <span className="rounded-full bg-[#E8F0D7] px-2 py-0.5 font-semibold text-[#386641]">×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Pricing */}
                  <div className="mt-4 rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#1D2D00]/40 line-through">PKR {deal.original_price.toLocaleString()}</p>
                        <p className="text-2xl font-black text-[#1D2D00]">PKR {deal.deal_price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#1D2D00]/40">You save</p>
                        <p className="text-lg font-black text-[#386641]">PKR {deal.savings.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#1D2D00]/40">
                      <span>{deal.current_uses} orders placed</span>
                      <span>{new Date(deal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => router.push(`/view-restaurant-deals?id=${deal.restaurant.id}&dealId=${deal.id}`)}
                      className="flex-1 rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#386641]">
                      Order This Deal
                    </button>
                    <button
                      onClick={() => handleFavourite(deal)}
                      title={favourites.has(deal.id) ? 'Remove from favourites' : 'Add to favourites'}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all ${
                        favourites.has(deal.id)
                          ? 'border-[#90CD1D] bg-[#E8F0D7] text-[#386641]'
                          : 'border-[#C8DFA0] bg-white text-[#1D2D00]/40 hover:border-[#90CD1D] hover:text-[#386641]'
                      }`}>
                      <svg className="h-5 w-5" fill={favourites.has(deal.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
