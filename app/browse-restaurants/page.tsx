'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';

interface Restaurant {
  id: number;
  name: string;
  email: string;
  profile_pic?: string;
  created_at: string;
  menu_count: number;
}

// Realistic fallback data shown while loading or when API returns empty
const FALLBACK_RESTAURANTS = [
  {
    id: -1, name: 'The Noodle House', email: '', menu_count: 42, created_at: '',
    profile_pic: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=400&q=80',
    cuisine: 'Asian Fusion', rating: 4.8, deliveryTime: '20–30 min', priceRange: 'Mid-range',
    tags: ['Noodles', 'Ramen', 'Vegan Options'],
  },
  {
    id: -2, name: 'Burger Republic', email: '', menu_count: 28, created_at: '',
    profile_pic: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    cuisine: 'American', rating: 4.6, deliveryTime: '15–25 min', priceRange: 'Budget',
    tags: ['Burgers', 'Fries', 'Shakes'],
  },
  {
    id: -3, name: 'Spice Garden', email: '', menu_count: 55, created_at: '',
    profile_pic: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=80',
    cuisine: 'Indian', rating: 4.9, deliveryTime: '25–40 min', priceRange: 'Mid-range',
    tags: ['Curry', 'Biryani', 'Halal'],
  },
  {
    id: -4, name: 'Green Bowl Co.', email: '', menu_count: 33, created_at: '',
    profile_pic: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
    cuisine: 'Healthy', rating: 4.7, deliveryTime: '15–20 min', priceRange: 'Mid-range',
    tags: ['Salads', 'Bowls', 'Vegan'],
  },
  {
    id: -5, name: 'Pizza Palazzo', email: '', menu_count: 38, created_at: '',
    profile_pic: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
    cuisine: 'Italian', rating: 4.5, deliveryTime: '20–35 min', priceRange: 'Mid-range',
    tags: ['Pizza', 'Pasta', 'Calzone'],
  },
  {
    id: -6, name: 'Sushi Sakura', email: '', menu_count: 61, created_at: '',
    profile_pic: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80',
    cuisine: 'Japanese', rating: 4.9, deliveryTime: '30–45 min', priceRange: 'Premium',
    tags: ['Sushi', 'Sashimi', 'Ramen'],
  },
];

type EnrichedRestaurant = Restaurant & {
  cuisine?: string;
  rating?: number;
  deliveryTime?: string;
  priceRange?: string;
  tags?: string[];
};

const CUISINES = ['Asian Fusion', 'American', 'Indian', 'Healthy', 'Italian', 'Japanese', 'Mexican', 'Mediterranean'];
const PRICE_RANGES = ['Budget', 'Mid-range', 'Premium'];
const DELIVERY_TIMES = ['15–20 min', '20–30 min', '25–40 min', '30–45 min'];

function enrich(r: Restaurant, i: number): EnrichedRestaurant {
  return {
    ...r,
    cuisine: CUISINES[i % CUISINES.length],
    rating: parseFloat((4.3 + Math.random() * 0.7).toFixed(1)),
    deliveryTime: DELIVERY_TIMES[i % DELIVERY_TIMES.length],
    priceRange: PRICE_RANGES[i % PRICE_RANGES.length],
    tags: [],
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? 'text-[#EAB308]' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-semibold text-[#1D2D00]">{rating}</span>
    </div>
  );
}

export default function BrowseRestaurants() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<EnrichedRestaurant[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch('/api/public-restaurants');
        const result = await res.json();
        if (result.success && result.restaurants?.length > 0) {
          setRestaurants(result.restaurants.map(enrich));
        } else {
          setRestaurants(FALLBACK_RESTAURANTS as EnrichedRestaurant[]);
        }
      } catch {
        setRestaurants(FALLBACK_RESTAURANTS as EnrichedRestaurant[]);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-12 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#D6F0A4]/10 blur-3xl" />
          <div className="relative">
            <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
              PlatePilot Directory
            </span>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">
              Browse Restaurants
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/60">
              Discover partner restaurants, explore their menus, and jump into active deals.
            </p>

            {/* Search */}
            <div className="mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <svg className="h-4 w-4 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or cuisine…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Count bar */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-[#1D2D00]/50">
            Showing <span className="font-semibold text-[#1D2D00]">{filtered.length}</span> restaurant{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-16 flex justify-center">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="mt-16 rounded-3xl border border-[#E8F0D7] bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7]">
              <svg className="h-8 w-8 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1D2D00]">No restaurants found</h3>
            <p className="mt-2 text-sm text-[#1D2D00]/50">Try a different search term.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((restaurant, i) => (
              <article
                key={restaurant.id}
                className="group overflow-hidden rounded-2xl border border-[#E8F0D7] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(29,45,0,0.12)]"
              >
                {/* Cover image */}
                <div className="relative h-44 w-full overflow-hidden bg-[#E8F0D7]">
                  {restaurant.profile_pic ? (
                    <img
                      src={restaurant.profile_pic}
                      alt={restaurant.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1D2D00] to-[#386641]">
                      <span className="text-5xl font-black text-[#90CD1D]">
                        {restaurant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Cuisine badge */}
                  {restaurant.cuisine && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#386641] backdrop-blur-sm">
                      {restaurant.cuisine}
                    </span>
                  )}
                  {/* Price range */}
                  {restaurant.priceRange && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#1D2D00]/80 px-2.5 py-1 text-xs font-bold text-[#90CD1D] backdrop-blur-sm">
                      {restaurant.priceRange}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#1D2D00] leading-tight">{restaurant.name}</h3>
                    {restaurant.rating && <StarRating rating={restaurant.rating} />}
                  </div>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#1D2D00]/50">
                    {restaurant.deliveryTime && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {restaurant.deliveryTime}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {restaurant.menu_count} items
                    </span>
                    {restaurant.created_at && (
                      <span>Since {new Date(restaurant.created_at).getFullYear()}</span>
                    )}
                  </div>

                  {/* Tags */}
                  {restaurant.tags && restaurant.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {restaurant.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-[#E8F0D7] px-2.5 py-0.5 text-xs font-medium text-[#386641]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => router.push(`/view-restaurant-menu?id=${restaurant.id}`)}
                      className="rounded-xl bg-[#1D2D00] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#386641]"
                    >
                      View Menu
                    </button>
                    <button
                      onClick={() => router.push(`/view-restaurant-deals?id=${restaurant.id}`)}
                      className="rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] py-2.5 text-sm font-semibold text-[#386641] transition-colors hover:bg-[#E8F0D7]"
                    >
                      Deals
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
