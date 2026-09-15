'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import RestaurantNavbar from '../../components/RestaurantNavbar';
import { getReceiptItemsFromOrder, printReceipt } from '../../lib/receipt';

interface OrderItem {
  id: number;
  food_id?: number;
  deal_id?: number;
  item_type: 'food' | 'deal';
  quantity: number;
  unit_price: number;
  total_price: number;
  food?: { name: string; image_url?: string };
  deals?: { deal_name: string; description: string };
}

interface Order {
  id: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  delivery_address?: string;
  phone_number?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  users: { username: string; email: string };
  order_items?: OrderItem[];
}

const STATUS_TABS: Array<{ key: Order['status']; label: string; icon: string }> = [
  { key: 'pending',   label: 'Pending',   icon: '⏳' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ready',     label: 'Ready',     icon: '🍽️' },
  { key: 'delivered', label: 'Delivered', icon: '🚚' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
];

const STATUS_STYLE: Record<Order['status'], string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-orange-50 text-orange-700 border-orange-200',
  ready:     'bg-[#E8F0D7] text-[#386641] border-[#C8DFA0]',
  delivered: 'bg-[#E8F0D7] text-[#1D2D00] border-[#C8DFA0]',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const NEXT_STATUS: Partial<Record<Order['status'], { status: Order['status']; label: string }>> = {
  pending:   { status: 'confirmed', label: 'Confirm Order'    },
  confirmed: { status: 'preparing', label: 'Start Preparing'  },
  preparing: { status: 'ready',     label: 'Mark Ready & Dispatch' },
  ready:     { status: 'delivered', label: 'Mark Complete'    },
};

export default function RestaurantOrders() {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [orders, setOrders]             = useState<Order[]>([]);
  const [error, setError]               = useState<string | null>(null);
  const [updatingId, setUpdatingId]     = useState<number | null>(null);
  const [activeTab, setActiveTab]       = useState<Order['status']>('pending');
  const [expandedId, setExpandedId]     = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      if (!ClientAuth.isAuthenticated()) { router.push('/restaurent'); return; }
      fetchOrders();
    };
    init();
  }, [router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/orders/restaurant', {
        headers: { ...ClientAuth.getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (result.success) setOrders(result.orders || []);
      else setError(result.error || 'Failed to fetch orders');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      setUpdatingId(orderId);
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/orders/update-status', {
        method: 'PATCH',
        headers: { ...ClientAuth.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else setError(result.error || 'Failed to update status');
    } catch { setError('Network error'); }
    finally { setUpdatingId(null); }
  };

  const countByStatus = (s: Order['status']) => orders.filter(o => o.status === s).length;

  // Show ALL orders for the active tab — no time filtering
  const filtered = orders
    .filter(o => o.status === activeTab)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const fmt = (d: string) => new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
      <span className="h-12 w-12 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <RestaurantNavbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-10 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                Restaurant Ops
              </span>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Orders</h1>
              <p className="mt-1 text-sm text-white/50">
                {orders.length} total order{orders.length !== 1 ? 's' : ''} · {countByStatus('pending')} pending
              </p>
            </div>
            <button onClick={fetchOrders} disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-600">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Status tabs ───────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_TABS.map(tab => {
            const count = countByStatus(tab.key);
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#1D2D00] text-white shadow-sm'
                    : 'border border-[#E8F0D7] bg-white text-[#386641] hover:bg-[#F0F4E8]'
                }`}>
                <span>{tab.icon}</span>
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active ? 'bg-[#90CD1D] text-[#1D2D00]' : 'bg-[#E8F0D7] text-[#386641]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Orders list ───────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-[#E8F0D7] bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7] text-3xl">
              {STATUS_TABS.find(t => t.key === activeTab)?.icon}
            </div>
            <h3 className="text-xl font-bold text-[#1D2D00]">No {activeTab} orders</h3>
            <p className="mt-1 text-sm text-[#1D2D00]/50">
              {activeTab === 'pending'
                ? 'New orders will appear here when customers place them.'
                : `No orders with "${activeTab}" status right now.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order, idx) => (
              <motion.article key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className="overflow-hidden rounded-2xl border border-[#E8F0D7] bg-white shadow-sm">

                {/* Order header — always visible */}
                <button
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F0D7] text-sm font-black text-[#386641]">
                      #{order.id}
                    </div>
                    <div>
                      <p className="font-bold text-[#1D2D00]">{order.users?.username || 'Customer'}</p>
                      <p className="text-xs text-[#1D2D00]/50">{order.users?.email}</p>
                      <p className="text-xs text-[#1D2D00]/40">{fmt(order.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="text-xl font-black text-[#1D2D00]">PKR {order.total_amount.toFixed(0)}</span>
                    <svg className={`h-4 w-4 text-[#1D2D00]/40 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {expandedId === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[#E8F0D7]"
                    >
                      <div className="p-5 space-y-4">

                        {/* Items */}
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Order Items</p>
                          <div className="space-y-2">
                            {order.order_items?.map(item => (
                              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] p-3">
                                {item.item_type === 'food' && item.food ? (
                                  <>
                                    {item.food.image_url ? (
                                      <img src={item.food.image_url} alt={item.food.name} className="h-12 w-12 rounded-lg object-cover" />
                                    ) : (
                                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8F0D7] text-xl">🍽️</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-[#1D2D00] truncate">{item.food.name}</p>
                                      <p className="text-xs text-[#1D2D00]/50">×{item.quantity} · PKR {item.unit_price.toFixed(0)} each</p>
                                    </div>
                                  </>
                                ) : item.item_type === 'deal' && item.deals ? (
                                  <>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#386641] to-[#1D2D00] text-xl">🎯</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-[#1D2D00] truncate">{item.deals.deal_name}</p>
                                      <p className="text-xs text-[#1D2D00]/50">×{item.quantity} · PKR {item.unit_price.toFixed(0)} each</p>
                                    </div>
                                  </>
                                ) : null}
                                <span className="shrink-0 font-bold text-[#1D2D00]">PKR {item.total_price.toFixed(0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery info */}
                        {(order.delivery_address || order.phone_number || order.special_instructions) && (
                          <div className="rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Delivery Info</p>
                            <div className="grid gap-2 text-sm sm:grid-cols-2">
                              {order.delivery_address && (
                                <div>
                                  <p className="text-xs text-[#1D2D00]/50">Address</p>
                                  <p className="font-medium text-[#1D2D00]">{order.delivery_address}</p>
                                </div>
                              )}
                              {order.phone_number && (
                                <div>
                                  <p className="text-xs text-[#1D2D00]/50">Phone</p>
                                  <p className="font-medium text-[#1D2D00]">{order.phone_number}</p>
                                </div>
                              )}
                              {order.special_instructions && (
                                <div className="sm:col-span-2">
                                  <p className="text-xs text-[#1D2D00]/50">Special Instructions</p>
                                  <p className="font-medium text-[#1D2D00]">{order.special_instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 border-t border-[#E8F0D7] pt-4">
                          {NEXT_STATUS[order.status] && (
                            <button
                              onClick={() => updateStatus(order.id, NEXT_STATUS[order.status]!.status)}
                              disabled={updatingId === order.id}
                              className="flex items-center gap-2 rounded-xl bg-[#1D2D00] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#386641] disabled:opacity-50">
                              {updatingId === order.id
                                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Updating…</>
                                : NEXT_STATUS[order.status]!.label}
                            </button>
                          )}

                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(order.id, 'cancelled')}
                              disabled={updatingId === order.id}
                              className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50">
                              Cancel Order
                            </button>
                          )}

                          <button
                            onClick={() => printReceipt({
                              orderId: order.id, status: order.status, totalAmount: order.total_amount,
                              createdAt: order.created_at, counterpartyLabel: 'Customer',
                              counterpartyValue: order.users?.username || order.users?.email,
                              deliveryAddress: order.delivery_address, phoneNumber: order.phone_number,
                              specialInstructions: order.special_instructions,
                              items: getReceiptItemsFromOrder(order),
                            })}
                            className="flex items-center gap-2 rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] px-4 py-2.5 text-sm font-semibold text-[#386641] transition-colors hover:bg-[#E8F0D7]">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Receipt
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
