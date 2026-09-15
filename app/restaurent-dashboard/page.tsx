'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantNavbar from '../../components/RestaurantNavbar';

interface RestaurantData {
  id: string;
  name: string;
  email: string;
  registration_number: string;
  created_at: string;
  profile_pic?: string;
}

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
interface DashboardOrder { status: OrderStatus; }

const actionCards = [
  {
    title: 'Orders',
    description: 'Track incoming orders and update statuses in real time.',
    route: '/restaurant-orders',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    badge: 'Core',
    featured: true,
  },
  {
    title: 'Add Item',
    description: 'Create new dishes and keep your menu fresh and up to date.',
    route: '/add-food',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    badge: 'Core',
  },
  {
    title: 'Menu',
    description: 'Browse and manage your full restaurant menu.',
    route: '/restaurant-menu',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    badge: 'Core',
  },
  {
    title: 'AI Deals',
    description: 'Create high-performing bundle offers with AI assistance.',
    route: '/ai-deal-maker',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    badge: 'Smart',
  },
  {
    title: 'Healthy Food',
    description: 'Generate healthier alternatives for your existing dishes.',
    route: '/make-healthy',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    badge: 'Smart',
  },
  {
    title: 'Eco Recipes',
    description: 'Highlight waste-free, sustainable dishes for modern diners.',
    route: '/sustainable-meal',
    icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    badge: 'Smart',
  },
];

export default function RestaurantDashboard() {
  const router = useRouter();
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orderStats, setOrderStats] = useState({ active: 0, pending: 0 });
  const [menuCount, setMenuCount] = useState<number | null>(null);
  const [dealsCount, setDealsCount] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      if (!ClientAuth.isAuthenticated()) { router.push('/restaurent'); return; }

      // Fetch order stats
      try {
        const res = await fetch('/api/orders/restaurant', { headers: { ...ClientAuth.getAuthHeaders(), 'Content-Type': 'application/json' } });
        const result = await res.json();
        if (result.success && Array.isArray(result.orders)) {
          const orders: DashboardOrder[] = result.orders;
          setOrderStats({
            pending: orders.filter(o => o.status === 'pending').length,
            active:  orders.filter(o => ['confirmed','preparing','ready'].includes(o.status)).length,
          });
        }
      } catch { /* non-critical */ }

      // Fetch menu items count and active deals count in parallel
      try {
        const [foodsRes, dealsRes] = await Promise.all([
          fetch('/api/restaurant-foods', { headers: { ...ClientAuth.getAuthHeaders(), 'Content-Type': 'application/json' } }),
          fetch('/api/restaurant-deals', { headers: { ...ClientAuth.getAuthHeaders(), 'Content-Type': 'application/json' } }),
        ]);
        const [foodsResult, dealsResult] = await Promise.all([foodsRes.json(), dealsRes.json()]);
        if (foodsResult.success) setMenuCount(foodsResult.foods?.length ?? 0);
        if (dealsResult.success) setDealsCount(dealsResult.deals?.filter((d: any) => d.is_active).length ?? 0);
      } catch { /* non-critical */ }

      // Fetch restaurant data
      const token = ClientAuth.getToken();
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const { supabase } = await import('../../lib/supabase');
        const { data, error } = await supabase
          .from('restaurant_user')
          .select('id, name, email, registration_number, profile_pic, created_at')
          .eq('id', payload.userId)
          .single();
        if (!error && data) {
          setRestaurantData({ id: data.id, name: data.name, email: data.email, registration_number: data.registration_number, profile_pic: data.profile_pic, created_at: data.created_at || new Date().toISOString() });
        } else {
          setRestaurantData({ id: payload.userId, name: payload.restaurantName, email: payload.email, registration_number: payload.registrationNumber, created_at: new Date().toISOString() });
        }
      } catch { router.push('/restaurent'); }
    };
    init();
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target?.result as string;
      setUploading(true);
      try {
        const { ClientAuth } = await import('../../lib/auth/jwt-auth');
        const res = await fetch('/api/restaurant-profile/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
          body: JSON.stringify({ imageFile: imageData, imageFileName: file.name }),
        });
        const result = await res.json();
        if (result.success) setRestaurantData(prev => prev ? { ...prev, profile_pic: result.imageUrl } : null);
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  if (!restaurantData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
        <span className="h-12 w-12 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
      </div>
    );
  }

  const core  = actionCards.filter(c => c.badge === 'Core');
  const smart = actionCards.filter(c => c.badge === 'Smart');

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <RestaurantNavbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-10 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#D6F0A4]/10 blur-3xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar with upload */}
              <label className="group relative cursor-pointer">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#90CD1D]/40">
                  {restaurantData.profile_pic ? (
                    <img src={restaurantData.profile_pic} alt={restaurantData.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#386641] to-[#1D2D00]">
                      <span className="text-2xl font-black text-[#90CD1D]">{restaurantData.name[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs font-semibold text-white">{uploading ? '…' : 'Change'}</span>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>

              <div>
                <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                  Restaurant Portal
                </span>
                <h1 className="mt-1 text-3xl font-black text-white">{restaurantData.name}</h1>
                <p className="text-sm text-white/50">{restaurantData.email} · #{restaurantData.registration_number}</p>
              </div>
            </div>

            {/* Date */}
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center backdrop-blur-sm">
              <p className="text-3xl font-black text-white">{new Date().getDate()}</p>
              <p className="text-xs text-white/60">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Active Orders',  value: orderStats.active,                    icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { label: 'Pending Orders', value: orderStats.pending,                   icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Menu Items',     value: menuCount  ?? '…',                    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { label: 'Active Deals',   value: dealsCount ?? '…',                    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-[#E8F0D7] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#1D2D00]/50">{s.label}</p>
                  <p className="mt-1 text-3xl font-black text-[#1D2D00]">{s.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0D7]">
                  <svg className="h-5 w-5 text-[#386641]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Core operations ───────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-black text-[#1D2D00]">Core Operations</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {core.map(card => (
              <button key={card.title} onClick={() => router.push(card.route)}
                className="group relative overflow-hidden rounded-2xl border border-[#E8F0D7] bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C8DFA0] hover:shadow-[0_16px_40px_rgba(29,45,0,0.1)]">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#90CD1D]/8 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#90CD1D]/15" />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0D7]">
                      <svg className="h-5 w-5 text-[#386641]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                      </svg>
                    </div>
                    <span className="rounded-full bg-[#E8F0D7] px-2.5 py-1 text-xs font-semibold text-[#386641]">{card.badge}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1D2D00]">{card.title}</h3>
                  <p className="mt-1 text-sm text-[#1D2D00]/60">{card.description}</p>
                  {card.featured && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0D7] px-2.5 py-1 text-xs font-semibold text-[#386641]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#90CD1D]" />
                      {orderStats.active} active · {orderStats.pending} pending
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#386641] opacity-0 transition-opacity group-hover:opacity-100">
                    Open <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Smart features ────────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-black text-[#1D2D00]">Smart Features</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {smart.map(card => (
              <button key={card.title} onClick={() => router.push(card.route)}
                className="group relative overflow-hidden rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C8DFA0] hover:shadow-[0_16px_40px_rgba(29,45,0,0.1)]">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#90CD1D]/8 transition-all duration-500 group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0D7]">
                      <svg className="h-5 w-5 text-[#386641]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                      </svg>
                    </div>
                    <span className="rounded-full bg-[#D6EAB8] px-2.5 py-1 text-xs font-semibold text-[#1D2D00]">{card.badge}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1D2D00]">{card.title}</h3>
                  <p className="mt-1 text-sm text-[#1D2D00]/60">{card.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#386641] opacity-0 transition-opacity group-hover:opacity-100">
                    Explore <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer link ───────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <button onClick={() => router.push('/view-deals')}
            className="flex items-center gap-2 rounded-full border border-[#C8DFA0] bg-white px-6 py-2.5 text-sm font-semibold text-[#386641] shadow-sm transition-all hover:bg-[#E8F0D7]">
            Manage existing deals
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
