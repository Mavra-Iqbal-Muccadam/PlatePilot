'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import GroceryList from '../../components/GroceryList';

export default function GroceryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (!userData) { router.push('/user-login'); return; }
    const parsed = JSON.parse(userData);
    setUserId(parsed.id);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF4]">
        <Navbar />
        <div className="flex justify-center py-24">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-12 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#D6F0A4]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                My Grocery List
              </span>
              <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Grocery Planner</h1>
              <p className="mt-3 max-w-xl text-base text-white/60">
                Track ingredients, manage your shopping list, fetch live prices, and export a professional budget PDF.
              </p>
            </div>
            {/* Quick tips */}
            <div className="hidden lg:flex flex-col gap-2 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#90CD1D]" />
                Add items from food detail pages
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#90CD1D]" />
                Show Estimated Prices to get estimated costs
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#90CD1D]" />
                Export PDF for a professional budget plan
              </div>
            </div>
          </div>
        </div>

        {/* ── Grocery list — full page inline mode ─────────────────────── */}
        {userId && <GroceryList userId={userId} inline />}
      </main>
    </div>
  );
}
