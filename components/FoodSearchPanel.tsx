'use client';

import { useState } from 'react';

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  restaurant_name: string;
  restaurant_id: number;
}

export default function FoodSearchPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/search-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const result = await res.json();
      setSearchResults(result.success ? result.foods || [] : []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="border-b border-[#E8F0D7] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. juicy chicken burger…"
            className="flex-1 rounded-xl border border-[#C8DFA0] px-4 py-2.5 text-sm focus:border-[#90CD1D] focus:outline-none focus:ring-2 focus:ring-[#90CD1D]/20"
            disabled={isSearching}
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="flex items-center gap-1.5 rounded-xl bg-[#386641] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D2D00] disabled:bg-gray-300"
          >
            {isSearching
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : '🔍'}
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasSearched && (
          <div className="mt-6 rounded-2xl bg-[#F0F4E8] p-6 text-center">
            <div className="mb-3 text-4xl">🤔</div>
            <p className="text-sm font-medium text-[#1D2D00]">
              Describe the food and I'll find it for you!
            </p>
            <p className="mt-1 text-xs text-[#1D2D00]/50">
              Try: "a small juicy chicken patty with brown bread"
            </p>
          </div>
        )}

        {hasSearched && isSearching && (
          <div className="mt-10 flex flex-col items-center gap-3 text-[#386641]">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
            <p className="text-sm">Searching for food…</p>
          </div>
        )}

        {hasSearched && !isSearching && searchResults.length === 0 && (
          <div className="mt-10 text-center">
            <div className="mb-2 text-4xl">😔</div>
            <p className="text-sm text-gray-500">No results found. Try a different description.</p>
          </div>
        )}

        {hasSearched && !isSearching && searchResults.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#386641]">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </p>
            {searchResults.map(food => (
              <div
                key={food.id}
                className="flex gap-3 rounded-xl border border-[#E8F0D7] bg-white p-3 transition-all hover:border-[#90CD1D] hover:shadow-md"
              >
                {food.image_url ? (
                  <img src={food.image_url} alt={food.name} className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#E8F0D7] text-2xl">🍽️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-[#1D2D00]">{food.name}</p>
                  <p className="text-xs text-gray-500">{food.restaurant_name}</p>
                  <p className="mt-1 text-sm font-bold text-[#386641]">PKR {food.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}