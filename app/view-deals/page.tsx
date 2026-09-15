'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import RestaurantNavbar from '../../components/RestaurantNavbar';

interface Deal {
  id: number;
  deal_name: string;
  description: string;
  original_price: number;
  deal_price: number;
  is_active: boolean;
  current_uses: number;
  created_at: string;
  items: Array<{ id: number; food_name: string; quantity: number }>;
}

export default function ViewDeals() {
  const router = useRouter();
  const [loading, setLoading]                 = useState(true);
  const [deals, setDeals]                     = useState<Deal[]>([]);
  const [editingPrice, setEditingPrice]       = useState<number | null>(null);
  const [tempPrice, setTempPrice]             = useState('');
  const [editingQty, setEditingQty]           = useState<{ dealId: number; itemId: number } | null>(null);
  const [tempQty, setTempQty]                 = useState('');
  const [toast, setToast]                     = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPrice, setSavingPrice]         = useState(false);
  const [savingQty, setSavingQty]             = useState(false);
  const [togglingId, setTogglingId]           = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      if (!ClientAuth.isAuthenticated()) { router.push('/restaurent'); return; }
      fetchDeals();
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchDeals = async () => {
    try {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/restaurant-deals', {
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
      });
      const result = await res.json();
      if (result.success) setDeals(result.deals);
    } catch { setToast({ type: 'error', text: 'Failed to load deals' }); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (dealId: number, current: boolean) => {
    try {
      setTogglingId(dealId);
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/toggle-deal-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
        body: JSON.stringify({ dealId, isActive: !current }),
      });
      const result = await res.json();
      if (result.success) {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, is_active: !current } : d));
        setToast({ type: 'success', text: `Deal ${!current ? 'activated' : 'deactivated'}` });
      } else setToast({ type: 'error', text: result.error || 'Failed to update' });
    } catch { setToast({ type: 'error', text: 'Network error' }); }
    finally { setTogglingId(null); }
  };

  const savePrice = async (dealId: number) => {
    const val = parseFloat(tempPrice);
    if (isNaN(val) || val <= 0) { setToast({ type: 'error', text: 'Enter a valid price' }); return; }
    try {
      setSavingPrice(true);
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/update-deal-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
        body: JSON.stringify({ dealId, dealPrice: val }),
      });
      const result = await res.json();
      if (result.success) {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, deal_price: val } : d));
        setEditingPrice(null);
        setToast({ type: 'success', text: 'Price updated' });
      } else setToast({ type: 'error', text: result.error || 'Failed to update price' });
    } catch { setToast({ type: 'error', text: 'Network error' }); }
    finally { setSavingPrice(false); }
  };

  const saveQty = async (dealId: number, itemId: number) => {
    const val = parseInt(tempQty);
    if (isNaN(val) || val <= 0) { setToast({ type: 'error', text: 'Enter a valid quantity' }); return; }
    try {
      setSavingQty(true);
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/update-deal-item-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
        body: JSON.stringify({ dealId, itemId, quantity: val }),
      });
      const result = await res.json();
      if (result.success) {
        setDeals(prev => prev.map(d => {
          if (d.id !== dealId) return d;
          return {
            ...d,
            items: d.items.map(i => i.id === itemId ? { ...i, quantity: val } : i),
            original_price: result.newOriginalPrice || d.original_price,
          };
        }));
        setEditingQty(null);
        setToast({ type: 'success', text: 'Quantity updated' });
      } else setToast({ type: 'error', text: result.error || 'Failed to update quantity' });
    } catch { setToast({ type: 'error', text: 'Network error' }); }
    finally { setSavingQty(false); }
  };

  const savings = (d: Deal) => Math.max(0, d.original_price - d.deal_price);
  const savingsPct = (d: Deal) => d.original_price > 0 ? Math.round((savings(d) / d.original_price) * 100) : 0;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
      <span className="h-12 w-12 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <RestaurantNavbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed left-1/2 top-5 z-[2000] -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl ${
          toast.type === 'success' ? 'border-[#90CD1D]/40 bg-[#1D2D00] text-[#D6F0A4]' : 'border-red-300 bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-10 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                Deal Manager
              </span>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">My Deals</h1>
              <p className="mt-1 text-sm text-white/50">
                {deals.length} deal{deals.length !== 1 ? 's' : ''} · {deals.filter(d => d.is_active).length} active
              </p>
            </div>
            <button onClick={() => router.push('/ai-deal-maker')}
              className="flex items-center gap-2 rounded-xl bg-[#90CD1D] px-5 py-2.5 text-sm font-bold text-[#1D2D00] transition-all hover:bg-[#D6F0A4]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Deal
            </button>
          </div>
        </div>

        {/* Empty */}
        {deals.length === 0 ? (
          <div className="rounded-3xl border border-[#E8F0D7] bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7]">
              <svg className="h-8 w-8 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1D2D00]">No deals yet</h2>
            <p className="mt-2 text-sm text-[#1D2D00]/50">Create your first deal to boost sales.</p>
            <button onClick={() => router.push('/ai-deal-maker')}
              className="mt-5 rounded-xl bg-[#1D2D00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
              Create First Deal
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {deals.map((deal, idx) => (
              <motion.article key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(29,45,0,0.1)] ${
                  deal.is_active ? 'border-[#E8F0D7]' : 'border-[#E8F0D7] opacity-70'
                }`}>

                {/* Card header */}
                <div className="flex items-start justify-between gap-3 border-b border-[#E8F0D7] p-5">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-lg font-bold text-[#1D2D00]">{deal.deal_name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[#1D2D00]/60">{deal.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    deal.is_active ? 'bg-[#E8F0D7] text-[#386641]' : 'bg-red-50 text-red-500'
                  }`}>
                    {deal.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Items */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Includes</p>
                    <div className="space-y-2">
                      {deal.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] px-3 py-2.5">
                          <span className="text-sm font-medium text-[#1D2D00]">{item.food_name}</span>
                          <div className="flex items-center gap-2">
                            {editingQty?.dealId === deal.id && editingQty?.itemId === item.id ? (
                              <>
                                <input type="number" value={tempQty} onChange={e => setTempQty(e.target.value)}
                                  className="w-14 rounded-lg border border-[#C8DFA0] px-2 py-1 text-center text-sm outline-none focus:border-[#90CD1D]"
                                  min="1" autoFocus />
                                <button onClick={() => saveQty(deal.id, item.id)} disabled={savingQty}
                                  className="rounded-lg bg-[#1D2D00] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#386641] disabled:opacity-50">
                                  {savingQty ? '…' : 'Save'}
                                </button>
                                <button onClick={() => setEditingQty(null)}
                                  className="rounded-lg border border-[#C8DFA0] px-2.5 py-1 text-xs font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="rounded-full bg-[#E8F0D7] px-2.5 py-0.5 text-xs font-bold text-[#386641]">×{item.quantity}</span>
                                <button onClick={() => { setEditingQty({ dealId: deal.id, itemId: item.id }); setTempQty(item.quantity.toString()); }}
                                  className="rounded-lg border border-[#C8DFA0] px-2 py-0.5 text-[10px] font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[#1D2D00]/50">Original Price</span>
                      <span className="text-[#1D2D00]/40 line-through">PKR {deal.original_price.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#1D2D00]">Deal Price</span>
                      {editingPrice === deal.id ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded-xl border border-[#C8DFA0] bg-white px-3 py-1.5">
                            <span className="mr-1.5 text-xs font-bold text-[#386641]">PKR</span>
                            <input type="number" value={tempPrice} onChange={e => setTempPrice(e.target.value)}
                              className="w-20 bg-transparent text-sm font-bold text-[#1D2D00] outline-none"
                              step="1" min="0" autoFocus />
                          </div>
                          <button onClick={() => savePrice(deal.id)} disabled={savingPrice}
                            className="rounded-xl bg-[#1D2D00] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#386641] disabled:opacity-50">
                            {savingPrice ? '…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingPrice(null)}
                            className="rounded-xl border border-[#C8DFA0] px-3 py-1.5 text-xs font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-[#1D2D00]">PKR {deal.deal_price.toLocaleString()}</span>
                          <button onClick={() => { setEditingPrice(deal.id); setTempPrice(deal.deal_price.toString()); }}
                            className="rounded-xl border border-[#C8DFA0] px-2.5 py-1 text-xs font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {savings(deal) > 0 && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-[#E8F0D7] px-3 py-2">
                        <span className="text-xs font-semibold text-[#386641]">Customer saves</span>
                        <span className="text-sm font-black text-[#386641]">
                          PKR {savings(deal).toLocaleString()} ({savingsPct(deal)}% off)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-[#1D2D00]/50">
                    <span>{deal.current_uses} orders placed</span>
                    <span>{new Date(deal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  {/* Toggle */}
                  <button onClick={() => toggleStatus(deal.id, deal.is_active)} disabled={togglingId === deal.id}
                    className={`w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                      deal.is_active
                        ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-[#1D2D00] text-white hover:bg-[#386641]'
                    }`}>
                    {togglingId === deal.id ? '…' : deal.is_active ? 'Deactivate Deal' : 'Activate Deal'}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
