'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import RestaurantNavbar from '../../components/RestaurantNavbar';

interface FoodDetail {
  id: number;
  food_id: number;
  ingredient_name: string;
  calories_count: number;
}

interface Food {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string;
  price: number;
  allergies?: string;
  image_url?: string;
  enabled: boolean;
  created_at: string;
  ingredients: FoodDetail[];
}

export default function RestaurantMenu() {
  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      if (!ClientAuth.isAuthenticated()) { router.push('/restaurent'); return; }
      fetchMenu();
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/restaurant-foods', {
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
      });
      const result = await res.json();
      if (result.success) setFoods(result.foods);
      else setError(result.error || 'Failed to fetch menu items');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (foodId: number, current: boolean) => {
    try {
      setTogglingId(foodId);
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/toggle-food-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
        body: JSON.stringify({ foodId, enabled: !current }),
      });
      const result = await res.json();
      if (result.success) {
        setFoods(prev => prev.map(f => f.id === foodId ? { ...f, enabled: !current } : f));
        setToast({ type: 'success', text: `Item ${!current ? 'enabled' : 'disabled'}` });
      } else setToast({ type: 'error', text: result.error || 'Failed to update' });
    } catch { setToast({ type: 'error', text: 'Network error' }); }
    finally { setTogglingId(null); }
  };

  const deleteFood = async (foodId: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(foodId);
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      const res = await fetch('/api/delete-food', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
        body: JSON.stringify({ foodId }),
      });
      const result = await res.json();
      if (result.success) {
        setFoods(prev => prev.filter(f => f.id !== foodId));
        setToast({ type: 'success', text: `"${name}" deleted` });
      } else setToast({ type: 'error', text: result.error || 'Failed to delete' });
    } catch { setToast({ type: 'error', text: 'Network error' }); }
    finally { setDeletingId(null); }
  };

  const totalCal = (ings: FoodDetail[]) => ings.reduce((s, i) => s + i.calories_count, 0);
  const allergiesArr = (s?: string) => s ? s.split(',').map(a => a.trim()).filter(Boolean) : [];
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const lowestPrice  = foods.length ? Math.min(...foods.map(f => f.price)) : 0;
  const highestPrice = foods.length ? Math.max(...foods.map(f => f.price)) : 0;
  const avgPrice     = foods.length ? foods.reduce((s, f) => s + f.price, 0) / foods.length : 0;
  const enabledCount = foods.filter(f => f.enabled).length;

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
                Menu Control
              </span>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Your Menu</h1>
              <p className="mt-1 text-sm text-white/50">{foods.length} items · {enabledCount} active</p>
            </div>
            <button onClick={() => router.push('/add-food')}
              className="flex items-center gap-2 rounded-xl bg-[#90CD1D] px-5 py-2.5 text-sm font-bold text-[#1D2D00] transition-all hover:bg-[#D6F0A4]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Item
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600">{error}</div>
        )}

        {foods.length === 0 ? (
          <div className="rounded-3xl border border-[#E8F0D7] bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7]">
              <svg className="h-8 w-8 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1D2D00]">No menu items yet</h2>
            <p className="mt-2 text-sm text-[#1D2D00]/50">Add your first dish to start building your menu.</p>
            <button onClick={() => router.push('/add-food')}
              className="mt-5 rounded-xl bg-[#1D2D00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
              Add First Item
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Total Items',   value: foods.length },
                { label: 'Active',        value: enabledCount },
                { label: 'Lowest Price',  value: `PKR ${lowestPrice.toFixed(0)}` },
                { label: 'Avg Price',     value: `PKR ${avgPrice.toFixed(0)}` },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-[#E8F0D7] bg-white p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-[#1D2D00]">{s.value}</p>
                  <p className="mt-0.5 text-xs text-[#1D2D00]/50">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {foods.map((food, idx) => (
                <motion.article key={food.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(29,45,0,0.1)] ${
                    food.enabled ? 'border-[#E8F0D7]' : 'border-red-200 opacity-75'
                  }`}>

                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-[#E8F0D7]">
                    {food.image_url ? (
                      <img src={food.image_url} alt={food.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">🍽️</div>
                    )}
                    {/* Price badge */}
                    <span className="absolute right-3 top-3 rounded-full bg-[#1D2D00]/80 px-3 py-1 text-xs font-bold text-[#90CD1D] backdrop-blur-sm">
                      PKR {food.price.toFixed(0)}
                    </span>
                    {/* Status badge */}
                    {!food.enabled && (
                      <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                        Disabled
                      </span>
                    )}
                    {/* Date */}
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
                      Added {fmt(food.created_at)}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1D2D00] leading-tight">{food.name}</h3>
                      {food.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-[#1D2D00]/60">{food.description}</p>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] p-3 text-center">
                        <p className="text-xl font-black text-[#1D2D00]">{food.ingredients.length}</p>
                        <p className="text-[10px] uppercase tracking-wide text-[#1D2D00]/50">Ingredients</p>
                      </div>
                      <div className="rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] p-3 text-center">
                        <p className="text-xl font-black text-[#1D2D00]">{totalCal(food.ingredients)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-[#1D2D00]/50">Calories</p>
                      </div>
                    </div>

                    {/* Ingredients */}
                    {food.ingredients.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Ingredients</p>
                        <div className="flex flex-wrap gap-1.5">
                          {food.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="rounded-full bg-[#E8F0D7] px-2.5 py-1 text-xs font-medium text-[#386641]">
                              {ing.ingredient_name}
                            </span>
                          ))}
                          {food.ingredients.length > 3 && (
                            <span className="rounded-full bg-[#F0F4E8] px-2.5 py-1 text-xs font-semibold text-[#386641]">
                              +{food.ingredients.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Allergens */}
                    {food.allergies && allergiesArr(food.allergies).length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Allergens</p>
                        <div className="flex flex-wrap gap-1.5">
                          {allergiesArr(food.allergies).map((a, i) => (
                            <span key={i} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 border-t border-[#E8F0D7] pt-4">
                      <button
                        onClick={() => toggleStatus(food.id, food.enabled)}
                        disabled={togglingId === food.id}
                        className={`rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                          food.enabled
                            ? 'border border-[#C8DFA0] bg-[#F0F4E8] text-[#386641] hover:bg-[#E8F0D7]'
                            : 'bg-[#1D2D00] text-white hover:bg-[#386641]'
                        }`}>
                        {togglingId === food.id ? '…' : food.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteFood(food.id, food.name)}
                        disabled={deletingId === food.id}
                        className="rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50">
                        {deletingId === food.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
