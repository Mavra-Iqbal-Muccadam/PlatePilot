"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";
import FoodCard from "../components/FoodCard";

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  allergies: string;
  restaurant: { id: number; name: string };
  ingredients: Array<{ name: string; calories: number }>;
  total_calories: number;
  protein_content?: number;
  carbs_content?: number;
  fat_content?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const stockImages = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
];

const resolveFoodImage = (food: FoodItem) => {
  if (food.image_url && /^(https?:\/\/|\/)/i.test(food.image_url)) return food.image_url;
  const hash = Array.from(`${food.id}-${food.name}`).reduce((a, c) => a + c.charCodeAt(0), 0);
  return stockImages[hash % stockImages.length];
};

const getCategory = (food: FoodItem): string => {
  const text = `${food.name} ${food.description}`.toLowerCase();
  if (/vegan|tofu|plant|kale|salad|acai|quinoa|lentil|chickpea|falafel|veggie/i.test(text)) return "Vegan";
  if (/protein|chicken|beef|egg|fish|salmon|turkey|tuna|shrimp/i.test(text)) return "High Protein";
  if (food.total_calories <= 400) return "Low Calorie";
  if (/keto|low.?carb/i.test(text)) return "Low Carb";
  return "Balanced";
};

const getRating = (id: number) => {
  const ratings: Record<number, number> = {};
  // deterministic pseudo-rating from id
  return ratings[id] ?? parseFloat((4.1 + (id % 9) * 0.1).toFixed(1));
};

const buildDescription = (food: FoodItem): string => {
  const raw = (food.description || "").replace(/\s+/g, " ").trim();
  if (raw.length > 40 && raw.split(" ").length > 7) {
    return raw.endsWith(".") ? raw : `${raw}.`;
  }
  const preview = food.ingredients.map(i => i.name).filter(Boolean).slice(0, 3).join(", ");
  if (preview) return `Prepared with ${preview}. A wholesome, flavourful choice.`;
  return "A carefully crafted dish designed for great taste and balanced nutrition.";
};

const CATEGORIES = ["All", "Vegan", "High Protein", "Low Calorie", "Low Carb", "Balanced"];
const SORT_OPTIONS = [
  { value: "default",   label: "Default"         },
  { value: "price_asc", label: "Price: Low → High"},
  { value: "price_desc",label: "Price: High → Low"},
  { value: "cal_asc",   label: "Calories: Low → High"},
  { value: "cal_desc",  label: "Calories: High → Low"},
  { value: "name_asc",  label: "Name: A → Z"     },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [foods, setFoods]           = useState<FoodItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState(searchParams.get("search") || searchParams.get("category") && "" || "");
  const [category, setCategory]     = useState(searchParams.get("category") || "All");
  const [sort, setSort]             = useState("default");
  const [maxPrice, setMaxPrice]     = useState(5000);
  const [maxCalories, setMaxCalories] = useState(1200);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetch("/api/all-foods")
      .then(r => r.json())
      .then(result => {
        if (result.success) setFoods(result.foods);
        else setError(result.error || "Unable to load menu");
      })
      .catch(() => setError("Network error while loading menu"))
      .finally(() => setLoading(false));
  }, []);

  // Derive max price from data for slider
  const dataMaxPrice = useMemo(() => Math.max(5000, ...foods.map(f => f.price)), [foods]);

  const filtered = useMemo(() => {
    let list = foods.filter(food => {
      const text = `${food.name} ${food.description} ${food.restaurant.name}`.toLowerCase();
      const searchOk  = !search || text.includes(search.toLowerCase());
      const catOk     = category === "All" || getCategory(food) === category;
      const priceOk   = food.price <= maxPrice;
      const calOk     = food.total_calories <= maxCalories;
      return searchOk && catOk && priceOk && calOk;
    });

    switch (sort) {
      case "price_asc":  list = [...list].sort((a, b) => a.price - b.price); break;
      case "price_desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "cal_asc":    list = [...list].sort((a, b) => a.total_calories - b.total_calories); break;
      case "cal_desc":   list = [...list].sort((a, b) => b.total_calories - a.total_calories); break;
      case "name_asc":   list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [foods, search, category, sort, maxPrice, maxCalories]);

  const activeFilterCount = [
    category !== "All",
    maxPrice < dataMaxPrice,
    maxCalories < 1200,
    sort !== "default",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setCategory("All");
    setMaxPrice(dataMaxPrice);
    setMaxCalories(1200);
    setSort("default");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-12 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#D6F0A4]/10 blur-3xl" />
          <div className="relative">
            <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
              Full Menu
            </span>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Menu</h1>
            <p className="mt-3 max-w-xl text-base text-white/60">
              Browse every dish from every restaurant. Filter by category, calories, price, and more.
            </p>

            {/* Search bar */}
            <div className="mt-6 flex max-w-lg items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <svg className="h-4 w-4 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search meals, restaurants, ingredients…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-white/40 hover:text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Filter bar ───────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  category === cat
                    ? "bg-[#1D2D00] text-white shadow-sm"
                    : "border border-[#C8DFA0] bg-white text-[#386641] hover:bg-[#E8F0D7]"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Sort */}
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="rounded-xl border border-[#C8DFA0] bg-white px-3 py-2 text-sm font-medium text-[#1D2D00] outline-none focus:border-[#90CD1D] focus:ring-2 focus:ring-[#90CD1D]/20">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Advanced filters toggle */}
            <button onClick={() => setFiltersOpen(v => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                filtersOpen || activeFilterCount > 0
                  ? "border-[#1D2D00] bg-[#1D2D00] text-white"
                  : "border-[#C8DFA0] bg-white text-[#386641] hover:bg-[#E8F0D7]"
              }`}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#90CD1D] text-[10px] font-bold text-[#1D2D00]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={resetFilters}
                className="rounded-xl border border-[#C8DFA0] bg-white px-3 py-2 text-sm text-[#386641] hover:bg-[#E8F0D7]">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Advanced filter panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-5 rounded-2xl border border-[#E8F0D7] bg-white p-6 sm:grid-cols-2">
                {/* Max Price */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1D2D00]">Max Price</span>
                    <span className="rounded-full bg-[#E8F0D7] px-3 py-1 text-xs font-bold text-[#386641]">
                      PKR {maxPrice.toLocaleString()}
                    </span>
                  </div>
                  <input type="range" min={200} max={dataMaxPrice} step={100}
                    value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#386641]" />
                  <div className="flex justify-between text-xs text-[#1D2D00]/40">
                    <span>PKR 200</span>
                    <span>PKR {dataMaxPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Max Calories */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1D2D00]">Max Calories</span>
                    <span className="rounded-full bg-[#E8F0D7] px-3 py-1 text-xs font-bold text-[#386641]">
                      {maxCalories} kcal
                    </span>
                  </div>
                  <input type="range" min={100} max={1200} step={50}
                    value={maxCalories} onChange={e => setMaxCalories(Number(e.target.value))}
                    className="w-full accent-[#386641]" />
                  <div className="flex justify-between text-xs text-[#1D2D00]/40">
                    <span>100 kcal</span>
                    <span>1200 kcal</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ──────────────────────────────────────────────────── */}
        <div className="mt-6">
          {loading && <Loader label="Loading menu…" />}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-[#1D2D00]/50">
                  Showing <span className="font-semibold text-[#1D2D00]">{filtered.length}</span> of{" "}
                  <span className="font-semibold text-[#1D2D00]">{foods.length}</span> meals
                </p>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-[#E8F0D7] bg-white p-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7]">
                    <svg className="h-8 w-8 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#1D2D00]">No meals found</h3>
                  <p className="mt-1 text-sm text-[#1D2D00]/50">Try adjusting your filters or search term.</p>
                  <button onClick={resetFilters}
                    className="mt-4 rounded-xl bg-[#1D2D00] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#386641]">
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((food, index) => (
                    <motion.div
                      key={food.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
                    >
                      <FoodCard
                        name={food.name}
                        description={buildDescription(food)}
                        price={food.price}
                        calories={food.total_calories}
                        category={getCategory(food)}
                        rating={getRating(food.id)}
                        imageUrl={resolveFoodImage(food)}
                        onSecondaryAction={() => router.push(`/view-restaurant-menu?id=${food.restaurant.id}`)}
                        onPrimaryAction={() => router.push(`/view-restaurant-menu?id=${food.restaurant.id}&foodId=${food.id}`)}
                        secondaryLabel="View Restaurant"
                        primaryLabel="Open Details"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
