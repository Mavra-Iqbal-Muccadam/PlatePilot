'use client';

import { useState } from 'react';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

interface FoodSearchChatProps {
  onFoodSelect?: (food: any) => void;
}

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  restaurant_name: string;
  restaurant_id: number;
}

export default function FoodSearchChat({ onFoodSelect }: FoodSearchChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleToggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      // Reset state when opening
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: searchQuery.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.foods || []);
      } else {
        console.error('Search failed:', result.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching food:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFoodSelect = (food: FoodItem) => {
    if (onFoodSelect) {
      onFoodSelect(food);
    }
    // Close the modal after selection
    setIsOpen(false);
  };

  return (
    <div>
      {/* Chat Toggle Button */}
      <button
        onClick={handleToggleChat}
        className="fixed bottom-24 left-6 flex h-20 w-20 flex-col items-center justify-center rounded-3xl border border-[#90CD1D]/30 bg-gradient-to-br from-[#386641] to-[#1D2D00] text-white shadow-2xl shadow-[#1D2D00]/30 backdrop-blur-md transition-all transform hover:-translate-y-1 hover:scale-105 hover:from-[#90CD1D] hover:to-[#386641] hover:text-[#1D2D00]"
        style={{ zIndex: 1000 }}
        title="Food Search Chatbot - Click to search for food by description"
        aria-label="Food Search Chatbot"
      >
        <HiOutlineChatBubbleLeftRight className="h-7 w-7" />
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/90">
          Food Chat
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleToggleChat();
            }
          }}
        >
          {/* Modal Content */}
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1D2D00] to-[#386641] text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl">🍽️ Food Search Assistant</h3>
                <p className="text-sm text-white/70">Describe your food and I'll find it!</p>
              </div>
              <button
                onClick={handleToggleChat}
                className="text-white hover:text-white/70 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              {!hasSearched ? (
                <div className="text-center">
                  <div className="bg-[#E8F0D7] rounded-xl p-6 mb-6">
                    <div className="text-4xl mb-4">🤔</div>
                    <p className="text-gray-700 mb-4">
                      Hi! It seems like you forgot a food name. Describe the food and I'll help you find it!
                    </p>
                    <p className="text-gray-600 text-sm">
                      For example: <em>"a small juicy chicken patty with brown bread"</em>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    {isSearching ? 'Searching...' : `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
                  </h4>
                  
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90CD1D]"></div>
                      <span className="ml-3 text-gray-600">Searching for food...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {searchResults.map((food) => (
                        <div
                          key={food.id}
                          onClick={() => handleFoodSelect(food)}
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-[#E8F0D7] hover:border-[#90CD1D] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {food.image_url ? (
                              <img 
                                src={food.image_url} 
                                alt={food.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🍽️</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-800">{food.name}</h5>
                              <p className="text-sm text-gray-600">{food.restaurant_name}</p>
                              <p className="text-lg font-bold text-[#386641]">PKR {food.price}</p>
                            </div>
                          </div>
                          {food.description && (
                            <p className="text-xs text-gray-500 mt-2">{food.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">😔</div>
                      <p className="text-gray-600">
                        Sorry, I couldn't find any food items matching your description. 
                        Try describing it differently!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Describe your food..." 
                  className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#90CD1D] focus:border-[#90CD1D]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  disabled={isSearching}
                />
                <button 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bg-gradient-to-r from-[#386641] to-[#1D2D00] hover:from-[#90CD1D] hover:to-[#386641] hover:text-[#1D2D00] disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    '🔍'
                  )}
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}