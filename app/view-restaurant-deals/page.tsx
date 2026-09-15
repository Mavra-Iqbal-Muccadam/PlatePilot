'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import OrderCart from '../../components/OrderCart';
import Navbar from '../../src/components/Navbar';
import HalalBadge from '../../components/HalalBadge';
import { getFavourites, toggleFavourite, isFavourite } from '../browse-deals/page';

interface Deal {
  id: number;
  deal_name: string;
  description: string;
  original_price: number;
  deal_price: number;
  current_uses: number;
  created_at: string;
  total_calories?: number;
  items: Array<{
    food_name: string;
    quantity: number;
    calories_per_item?: number;
    total_calories?: number;
    ingredients?: Array<{ name: string; calories: number }>;
  }>;
  savings: number;
  savingsPercentage: number;
}

interface Restaurant {
  id: number;
  name: string;
  profile_pic?: string;
}

const dealImages = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80',
];

export default function ViewRestaurantDeals() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('id');
  const dealIdParam  = searchParams.get('dealId');

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orderMessage, setOrderMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [showMealTypeModal, setShowMealTypeModal] = useState(false);
  const [pendingDeal, setPendingDeal] = useState<Deal | null>(null);
  const [updatingCalories, setUpdatingCalories] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [favourites, setFavourites] = useState<Set<number>>(new Set());

  useEffect(() => {
    setFavourites(new Set(getFavourites().map((f: any) => f.id)));
  }, []);

  // Auto-expand the deal specified in the URL
  useEffect(() => {
    if (dealIdParam) setExpandedId(parseInt(dealIdParam, 10));
  }, [dealIdParam]);

  const handleFavourite = async (deal: Deal) => {
    const isNowFav = !favourites.has(deal.id);
    const next = new Set(favourites);
    if (isNowFav) next.add(deal.id); else next.delete(deal.id);
    setFavourites(next);
    setOrderMessage({ type: 'success', message: isNowFav ? `"${deal.deal_name}" added to favourites` : `"${deal.deal_name}" removed from favourites` });

    if (userId) {
      if (isNowFav) {
        await fetch('/api/user-favourites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, dealId: deal.id }) });
      } else {
        await fetch(`/api/user-favourites?userId=${userId}&dealId=${deal.id}`, { method: 'DELETE' });
      }
    } else {
      toggleFavourite(deal as any);
    }
    window.dispatchEvent(new Event('favouritesUpdated'));
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token && token.startsWith('user_')) {
      const userData = localStorage.getItem('userData');
      if (userData) setUserId(JSON.parse(userData).id);
    }
  }, []);

  // Load favourites from API
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/user-favourites?userId=${userId}`)
      .then(r => r.json())
      .then(result => {
        if (result.success) setFavourites(new Set(result.favourites.map((f: any) => f.id)));
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!restaurantId) { router.push('/browse-restaurants'); return; }
    fetch(`/api/restaurant-specific-deals?restaurantId=${restaurantId}`)
      .then(r => r.json())
      .then(result => {
        if (result.success) { setRestaurant(result.restaurant); setDeals(result.deals); }
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        // Scroll to the specific deal after load
        if (dealIdParam) {
          setTimeout(() => {
            document.getElementById(`deal-${dealIdParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      });
  }, [restaurantId, router]);

  useEffect(() => {
    if (!orderMessage) return;
    const t = setTimeout(() => setOrderMessage(null), 3000);
    return () => clearTimeout(t);
  }, [orderMessage]);

  const handleAddDealToCart = (deal: Deal) => {
    if (!userId) { setOrderMessage({ type: 'error', message: 'Please log in to add deals to cart' }); return; }
    setPendingDeal(deal);
    setShowCalorieModal(true);
  };

  const handleCalorieYes = () => { setShowCalorieModal(false); setShowMealTypeModal(true); };
  const handleCalorieNo  = () => { setShowCalorieModal(false); if (pendingDeal) addToCartOnly(pendingDeal); };

  const handleMealTypeSelect = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!pendingDeal || !userId) return;
    setUpdatingCalories(true);
    try {
      const { CalorieCalculatorService } = await import('../../lib/services/calorie-calculator');
      const totalCalories = await new CalorieCalculatorService().calculateDealCalories(pendingDeal.id);
      const getData = await (await fetch(`/api/user-calory?userId=${userId}`)).json();
      if (getData.success && getData.data) {
        const d = getData.data;
        await fetch('/api/user-calory', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, current_calory: (Number(d.current_calory) || 0) + totalCalories, [mealType]: (Number(d[mealType]) || 0) + totalCalories }),
        });
        const tracked = JSON.parse(localStorage.getItem('trackedCalorieItems') || '{}');
        tracked[`${restaurantId}_deal_${pendingDeal.id}`] = { calories: totalCalories, mealType, tracked: true };
        localStorage.setItem('trackedCalorieItems', JSON.stringify(tracked));
      }
    } catch { setOrderMessage({ type: 'error', message: 'Error updating calorie count' }); }
    finally {
      setUpdatingCalories(false);
      setShowMealTypeModal(false);
      if (pendingDeal) addToCartOnly(pendingDeal);
    }
  };

  const addToCartOnly = (deal: Deal) => {
    const fn = (window as any)[`addToCart_${restaurantId}`];
    if (fn) {
      fn({ id: deal.id, name: deal.deal_name, price: deal.deal_price, quantity: 1, type: 'deal', description: deal.description });
      setOrderMessage({ type: 'success', message: `${deal.deal_name} added to cart!` });
    }
    setPendingDeal(null);
  };

  // If a specific deal is requested, show it in detail view
  const targetDeal = dealIdParam ? deals.find(d => d.id === parseInt(dealIdParam, 10)) : null;

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAF4]">
      <Navbar />
      <div className="flex justify-center py-24">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
      </div>
    </div>
  );

  if (!restaurant) return (
    <div className="min-h-screen bg-[#F8FAF4]">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="rounded-2xl border border-[#E8F0D7] bg-white p-10">
          <h2 className="mb-3 text-xl font-bold text-[#1D2D00]">Restaurant Not Found</h2>
          <button onClick={() => router.push('/browse-restaurants')}
            className="mt-4 rounded-xl bg-[#1D2D00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
            Back to Restaurants
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-12 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#D6F0A4]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#90CD1D]/30">
                {restaurant.profile_pic ? (
                  <img src={restaurant.profile_pic} alt={restaurant.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#386641] to-[#1D2D00]">
                    <span className="text-2xl font-black text-[#90CD1D]">{restaurant.name[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div>
                <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                  Deals Hub
                </span>
                <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">{restaurant.name}</h1>
                <p className="mt-1 text-sm text-white/50">{deals.length} active deal{deals.length !== 1 ? 's' : ''} available</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push(`/view-restaurant-menu?id=${restaurantId}`)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
                View Menu
              </button>
              <button onClick={() => router.push('/browse-restaurants')}
                className="rounded-xl bg-[#90CD1D] px-5 py-2.5 text-sm font-bold text-[#1D2D00] transition-all hover:bg-[#D6F0A4]">
                All Restaurants
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {orderMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={`mb-6 flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-sm ${
                orderMessage.type === 'success'
                  ? 'border-[#90CD1D]/40 bg-[#E8F0D7] text-[#386641]'
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}>
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={orderMessage.type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
              </svg>
              {orderMessage.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Single deal detail view (when dealId is in URL) ─────── */}
        {targetDeal && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <button onClick={() => router.push(`/view-restaurant-deals?id=${restaurantId}`)}
                className="flex items-center gap-1.5 text-sm text-[#1D2D00]/50 hover:text-[#386641]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All deals
              </button>
              <span className="text-[#1D2D00]/30">/</span>
              <span className="text-sm font-semibold text-[#1D2D00]">{targetDeal.deal_name}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left: deal info */}
              <div className="space-y-5">
                {/* Cover */}
                <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-[#E8F0D7] sm:h-80">
                  <img src={dealImages[targetDeal.id % dealImages.length]} alt={targetDeal.deal_name}
                    className="h-full w-full object-cover" />
                  {targetDeal.savingsPercentage > 0 && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#90CD1D] px-3 py-1.5 text-sm font-bold text-[#1D2D00]">
                      {targetDeal.savingsPercentage}% OFF
                    </span>
                  )}
                  {targetDeal.total_calories && targetDeal.total_calories > 0 && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#1D2D00]/80 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                      {targetDeal.total_calories} kcal
                    </span>
                  )}
                </div>

                {/* Title + description */}
                <div className="rounded-2xl border border-[#E8F0D7] bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-[#1D2D00]">{targetDeal.deal_name}</h2>
                      <p className="mt-2 text-sm leading-7 text-[#1D2D00]/60">{targetDeal.description}</p>
                    </div>
                    <HalalBadge dealId={targetDeal.id} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#E8F0D7] px-3 py-1.5 text-xs font-semibold text-[#386641]">
                      🍽️ {targetDeal.items.length} items included
                    </span>
                    <span className="rounded-full bg-[#E8F0D7] px-3 py-1.5 text-xs font-semibold text-[#386641]">
                      📦 {targetDeal.current_uses} orders placed
                    </span>
                    <span className="rounded-full bg-[#E8F0D7] px-3 py-1.5 text-xs font-semibold text-[#386641]">
                      📅 {new Date(targetDeal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Food items detail */}
                <div className="rounded-2xl border border-[#E8F0D7] bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1D2D00]">What's included</h3>
                    {targetDeal.total_calories && targetDeal.total_calories > 0 && (
                      <span className="rounded-full bg-[#1D2D00] px-3 py-1.5 text-xs font-bold text-[#90CD1D]">
                        🔥 {targetDeal.total_calories} kcal total
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {targetDeal.items.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F0D7] text-xl">🍽️</div>
                            <div>
                              <p className="font-bold text-[#1D2D00]">{item.food_name}</p>
                              <p className="text-xs text-[#1D2D00]/50">Part of this deal bundle</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-[#1D2D00] px-2.5 py-1 text-xs font-bold text-[#90CD1D]">×{item.quantity}</span>
                            {item.calories_per_item && item.calories_per_item > 0 && (
                              <span className="rounded-full bg-[#E8F0D7] px-2.5 py-1 text-[10px] font-semibold text-[#386641]">
                                {item.calories_per_item} kcal each
                              </span>
                            )}
                            {item.quantity > 1 && item.total_calories && item.total_calories > 0 && (
                              <span className="rounded-full bg-[#D6EAB8] px-2.5 py-1 text-[10px] font-bold text-[#1D2D00]">
                                {item.total_calories} kcal total
                              </span>
                            )}
                          </div>
                        </div>
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div className="mt-3 border-t border-[#E8F0D7] pt-3 space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1D2D00]/40">Ingredients</p>
                            {item.ingredients.map((ing, iIdx) => (
                              <div key={iIdx} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-[#1D2D00]/60">
                                  <span className="h-1 w-1 rounded-full bg-[#90CD1D]" />
                                  {ing.name}
                                </span>
                                <span className="font-medium text-[#1D2D00]/60">{ing.calories} kcal</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {targetDeal.total_calories && targetDeal.total_calories > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-[#1D2D00] px-5 py-3">
                        <span className="text-sm font-semibold text-[#D6F0A4]">Deal Total Calories</span>
                        <span className="text-lg font-black text-[#90CD1D]">{targetDeal.total_calories} kcal</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: pricing + order */}
              <div className="space-y-4">
                {/* Pricing card */}
                <div className="rounded-2xl border border-[#E8F0D7] bg-white p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1D2D00]/50">Pricing</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#1D2D00]/60">Original price</span>
                      <span className="text-sm text-[#1D2D00]/40 line-through">PKR {targetDeal.original_price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#1D2D00]">Deal price</span>
                      <span className="text-3xl font-black text-[#1D2D00]">PKR {targetDeal.deal_price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[#E8F0D7] px-4 py-3">
                      <span className="text-sm font-semibold text-[#386641]">You save</span>
                      <span className="text-lg font-black text-[#386641]">PKR {targetDeal.savings.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Order button */}
                <button onClick={() => handleAddDealToCart(targetDeal)} disabled={!userId}
                  className="w-full rounded-2xl bg-[#1D2D00] py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-[#386641] disabled:cursor-not-allowed disabled:opacity-50">
                  {!userId ? 'Login to Order' : 'Add to Cart'}
                </button>

                {!userId && (
                  <button onClick={() => router.push('/user-login')}
                    className="w-full rounded-2xl border border-[#C8DFA0] bg-[#F0F4E8] py-3 text-sm font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                    Login to Order
                  </button>
                )}

                {/* Favourite */}
                <button onClick={() => handleFavourite(targetDeal)}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-all ${
                    favourites.has(targetDeal.id)
                      ? 'border-[#90CD1D] bg-[#E8F0D7] text-[#386641]'
                      : 'border-[#C8DFA0] bg-white text-[#1D2D00]/60 hover:border-[#90CD1D] hover:text-[#386641]'
                  }`}>
                  <svg className="h-4 w-4" fill={favourites.has(targetDeal.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {favourites.has(targetDeal.id) ? 'Saved to Favourites' : 'Add to Favourites'}
                </button>

                {/* Restaurant info */}
                <div className="rounded-2xl border border-[#E8F0D7] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#C8DFA0] bg-[#E8F0D7]">
                      {restaurant.profile_pic ? (
                        <img src={restaurant.profile_pic} alt={restaurant.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#386641] to-[#1D2D00]">
                          <span className="text-sm font-black text-[#90CD1D]">{restaurant.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1D2D00]">{restaurant.name}</p>
                      <button onClick={() => router.push(`/view-restaurant-menu?id=${restaurantId}`)}
                        className="text-xs text-[#386641] hover:underline">
                        View full menu →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider before other deals */}
            {deals.length > 1 && (
              <div className="mt-10">
                <h3 className="mb-5 text-lg font-bold text-[#1D2D00]">Other deals from {restaurant.name}</h3>
              </div>
            )}
          </div>
        )}

        {/* ── Deal cards grid ───────────────────────────────────────── */}
        {deals.length === 0 && !targetDeal && (
          <div className="rounded-3xl border border-[#E8F0D7] bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7]">
              <svg className="h-8 w-8 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1D2D00]">No active deals</h3>
            <p className="mt-2 text-sm text-[#1D2D00]/50">{restaurant.name} doesn't have any active deals right now.</p>
            <button onClick={() => router.push(`/view-restaurant-menu?id=${restaurantId}`)}
              className="mt-5 rounded-xl bg-[#1D2D00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
              View Menu Instead
            </button>
          </div>
        )}

        {/* Deal cards */}
        {deals.filter(d => !targetDeal || d.id !== targetDeal.id).length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deals.filter(d => !targetDeal || d.id !== targetDeal.id).map((deal, i) => (
              <motion.article key={deal.id}
                id={`deal-${deal.id}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.2) }}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(29,45,0,0.12)] ${
                  dealIdParam && deal.id === parseInt(dealIdParam, 10)
                    ? 'border-[#90CD1D] ring-2 ring-[#90CD1D]/30'
                    : 'border-[#E8F0D7]'
                }`}>

                {/* Cover image */}
                <div className="relative h-44 w-full overflow-hidden bg-[#E8F0D7]">
                  <img src={dealImages[deal.id % dealImages.length]} alt={deal.deal_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {deal.savingsPercentage > 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#90CD1D] px-2.5 py-1 text-xs font-bold text-[#1D2D00]">
                      {deal.savingsPercentage}% OFF
                    </span>
                  )}
                  {deal.total_calories && deal.total_calories > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#1D2D00]/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {deal.total_calories} kcal
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  {/* Title + halal */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold leading-tight text-[#1D2D00]">{deal.deal_name}</h3>
                    <HalalBadge dealId={deal.id} />
                  </div>

                  <p className="mt-1.5 text-sm leading-6 text-[#1D2D00]/60 line-clamp-2">{deal.description}</p>

                  {/* Collapsible items */}
                  <div className="mt-3">
                    <button onClick={() => setExpandedId(expandedId === deal.id ? null : deal.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#386641] hover:text-[#1D2D00]">
                      <svg className={`h-3.5 w-3.5 transition-transform ${expandedId === deal.id ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {deal.items.length} item{deal.items.length !== 1 ? 's' : ''} included
                      {deal.total_calories && deal.total_calories > 0 && (
                        <span className="ml-1 rounded-full bg-[#E8F0D7] px-2 py-0.5 text-[10px] font-bold text-[#386641]">
                          {deal.total_calories} kcal total
                        </span>
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedId === deal.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                          <div className="mt-2 space-y-2">
                            {deal.items.map((item, idx) => (
                              <div key={idx} className="rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] p-3">
                                {/* Item header */}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-[#1D2D00]">{item.food_name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-[#1D2D00] px-2 py-0.5 text-[10px] font-bold text-[#90CD1D]">×{item.quantity}</span>
                                    {item.calories_per_item && item.calories_per_item > 0 && (
                                      <span className="rounded-full bg-[#E8F0D7] px-2 py-0.5 text-[10px] font-semibold text-[#386641]">
                                        {item.calories_per_item} kcal each
                                      </span>
                                    )}
                                    {item.quantity > 1 && item.total_calories && item.total_calories > 0 && (
                                      <span className="rounded-full bg-[#D6EAB8] px-2 py-0.5 text-[10px] font-bold text-[#1D2D00]">
                                        {item.total_calories} kcal total
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Ingredients breakdown */}
                                {item.ingredients && item.ingredients.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {item.ingredients.map((ing, iIdx) => (
                                      <div key={iIdx} className="flex items-center justify-between text-xs text-[#1D2D00]/60">
                                        <span className="flex items-center gap-1.5">
                                          <span className="h-1 w-1 rounded-full bg-[#90CD1D]" />
                                          {ing.name}
                                        </span>
                                        <span className="font-medium">{ing.calories} kcal</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                            {/* Deal total calories summary */}
                            {deal.total_calories && deal.total_calories > 0 && (
                              <div className="flex items-center justify-between rounded-xl bg-[#1D2D00] px-4 py-2.5">
                                <span className="text-xs font-semibold text-[#D6F0A4]">Deal Total Calories</span>
                                <span className="text-sm font-black text-[#90CD1D]">{deal.total_calories} kcal</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Full description below items */}
                  {deal.description && (
                    <div className="mt-3 rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/40 mb-1">About this deal</p>
                      <p className="text-sm leading-6 text-[#1D2D00]/70">{deal.description}</p>
                    </div>
                  )}

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
                    <button onClick={() => handleAddDealToCart(deal)} disabled={!userId}
                      className="flex-1 rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#386641] disabled:cursor-not-allowed disabled:opacity-50">
                      {!userId ? 'Login to Order' : 'Add to Cart'}
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

      {userId && restaurant && (
        <OrderCart restaurantId={parseInt(restaurantId!)} restaurantName={restaurant.name}
          onOrderSuccess={id => setOrderMessage({ type: 'success', message: `Order #${id} placed successfully!` })}
          onOrderError={err => setOrderMessage({ type: 'error', message: err })} />
      )}

      {/* Calorie modal */}
      {showCalorieModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-black text-[#1D2D00]">Track Calories?</h3>
            <p className="mt-2 text-sm text-[#1D2D00]/60">
              Are you ordering <span className="font-semibold text-[#1D2D00]">{pendingDeal?.deal_name}</span> for yourself?
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={handleCalorieNo}
                className="flex-1 rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] py-3 text-sm font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                No, skip
              </button>
              <button onClick={handleCalorieYes}
                className="flex-1 rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white hover:bg-[#386641]">
                Yes, track
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal type modal */}
      {showMealTypeModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-black text-[#1D2D00]">Which meal?</h3>
            <p className="mt-2 text-sm text-[#1D2D00]/60">Select the meal type to track calories accurately.</p>
            <div className="mt-5 space-y-2.5">
              {([['breakfast','🌅 Breakfast'],['lunch','🌞 Lunch'],['dinner','🌙 Dinner']] as const).map(([type, label]) => (
                <button key={type} onClick={() => handleMealTypeSelect(type)} disabled={updatingCalories}
                  className="w-full rounded-xl bg-[#F0F4E8] py-3 text-sm font-semibold text-[#1D2D00] transition-colors hover:bg-[#E8F0D7] disabled:opacity-50">
                  {updatingCalories ? 'Updating…' : label}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowMealTypeModal(false); setPendingDeal(null); }} disabled={updatingCalories}
              className="mt-3 w-full rounded-xl border border-[#C8DFA0] py-2.5 text-sm text-[#1D2D00]/50 hover:bg-[#F0F4E8] disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
