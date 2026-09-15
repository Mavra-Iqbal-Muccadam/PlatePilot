'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

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
  created_at: string;
  ingredients: FoodDetail[];
}

export default function MakeHealthy() {
  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        // Check authentication
        const { ClientAuth } = await import('../../lib/auth/jwt-auth');
        
        if (!ClientAuth.isAuthenticated()) {
          router.push('/restaurent');
          return;
        }

        // Fetch restaurant foods
        const response = await fetch('/api/restaurant-foods', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...ClientAuth.getAuthHeaders()
          }
        });

        const result = await response.json();

        if (result.success) {
          setFoods(result.foods);
        } else {
          setError(result.error || 'Failed to fetch foods');
        }
      } catch (error) {
        console.error('Error fetching foods:', error);
        setError('An error occurred while fetching foods');
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [router]);

  const calculateTotalCalories = (ingredients: FoodDetail[]) => {
    return ingredients.reduce((total, ingredient) => total + ingredient.calories_count, 0);
  };

  const getAllergiesArray = (allergies?: string) => {
    if (!allergies) return [];
    return allergies.split(',').map(allergy => allergy.trim()).filter(Boolean);
  };

  const handleGenerateHealthyDish = async () => {
    if (!selectedFood) {
      alert('Please select a food item first');
      return;
    }

    setIsGenerating(true);
    try {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');

      if (!ClientAuth.isAuthenticated()) {
        router.push('/restaurent');
        return;
      }

      const response = await fetch('/api/generate-healthy-dish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...ClientAuth.getAuthHeaders()
        },
        body: JSON.stringify({
          dishName: selectedFood.name,
          ingredients: selectedFood.ingredients.map((ing) => ing.ingredient_name)
        })
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('healthyDishResult', JSON.stringify({
          originalFood: selectedFood,
          healthyVersion: result.healthyDish
        }));
        router.push('/make-healthy-results');
      } else {
        alert(result.error || 'Failed to generate healthy version');
      }
    } catch (error) {
      console.error('Error generating healthy dish:', error);
      alert('An error occurred while generating healthy version');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#90CD1D] border-b-[#1D2D00]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#386641] mb-4">Error</h2>
          <p className="text-[#6A994E] mb-4">{error}</p>
          <button
            onClick={() => router.push('/restaurent-dashboard')}
            className="rounded-lg border border-[#90CD1D]/45 bg-[#386641] px-6 py-3 text-white transition-all hover:bg-[#6A994E]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAF4] text-[#386641]`}>
      <header className="border-b border-[#90CD1D]/30 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A994E]">Healthy Lab</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1D2D00]">Make Your Food Healthy</h1>
            <p className="mt-1 text-sm text-[#6A994E]">Choose any menu item and generate a healthier version with AI.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateHealthyDish}
              disabled={!selectedFood || isGenerating}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                !selectedFood || isGenerating
                  ? 'cursor-not-allowed bg-gray-400 text-white opacity-70'
                  : 'bg-[#386641] text-white shadow-[0_10px_24px_rgba(56,102,65,0.3)] hover:bg-[#6A994E]'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                  Generating
                </>
              ) : (
                <>
                  <span>AI</span>
                  Make Healthy
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/restaurent-dashboard')}
              className="rounded-xl border border-[#90CD1D]/35 bg-white px-5 py-2.5 text-sm font-semibold text-[#386641] transition-all hover:bg-[#F8FAF4]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {foods.length === 0 ? (
          <section className="rounded-[22px] border border-[#90CD1D]/30 bg-white px-6 py-16 text-center shadow-[0_18px_34px_rgba(144,205,29,0.12)]">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#90CD1D] to-[#6A994E]">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#1D2D00]">No Menu Items Found</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-[#6A994E]">Add menu items first, then select one to generate a healthier alternative.</p>
            <button
              onClick={() => router.push('/add-food')}
              className="mt-8 rounded-xl bg-[#386641] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(56,102,65,0.25)] transition-all hover:scale-[1.02] hover:bg-[#6A994E]"
            >
              Add Menu Items
            </button>
          </section>
        ) : (
          <>
            <section className="mb-6 rounded-[18px] border border-[#90CD1D]/30 bg-white p-5 shadow-[0_14px_30px_rgba(144,205,29,0.1)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[#1D2D00]">Menu Selection</h2>
                  <p className="mt-1 text-sm text-[#6A994E]">
                    {selectedFood
                      ? `Selected: ${selectedFood.name}`
                      : 'Select a dish card to enable healthy transformation.'}
                  </p>
                </div>
                <p className="rounded-full border border-[#90CD1D]/45 bg-[#F8FAF4]/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6A994E]">
                  {foods.length} items
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {foods.map((food) => {
                const isSelected = selectedFood?.id === food.id;
                return (
                  <article
                    key={food.id}
                    className={`group overflow-hidden rounded-[20px] border bg-white shadow-[0_14px_30px_rgba(144,205,29,0.12)] transition-all duration-300 ${
                      isSelected
                        ? 'border-[#386641] ring-2 ring-[#90CD1D]/70'
                        : 'border-[#90CD1D]/30 hover:-translate-y-1 hover:border-[#90CD1D]/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFood(isSelected ? null : food)}
                      className="w-full text-left"
                    >
                      <div className="relative h-52 bg-gradient-to-br from-[#90CD1D]/35 to-[#F8FAF4]">
                        {food.image_url ? (
                          <img
                            src={food.image_url}
                            alt={food.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <svg className="h-16 w-16 text-[#6A994E]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                        )}

                        <div className="absolute right-4 top-4 rounded-full border border-[#90CD1D]/45 bg-white/95 px-3 py-1 text-sm font-bold text-[#386641]">
                          PKR {food.price}
                        </div>

                        {isSelected && (
                          <div className="absolute left-4 top-4 rounded-full bg-[#386641] px-3 py-1 text-xs font-semibold text-white">
                            Selected
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 p-5">
                        <div>
                          <h3 className="text-xl font-semibold tracking-tight text-[#1D2D00]">{food.name}</h3>
                          {food.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-[#6A994E]">{food.description}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-[#90CD1D]/45 bg-[#F8FAF4]/50 p-3 text-center">
                            <p className="text-2xl font-bold text-[#1D2D00]">{food.ingredients.length}</p>
                            <p className="text-xs uppercase tracking-[0.08em] text-[#6A994E]">Ingredients</p>
                          </div>
                          <div className="rounded-xl border border-[#90CD1D]/45 bg-[#F8FAF4]/50 p-3 text-center">
                            <p className="text-2xl font-bold text-[#1D2D00]">{calculateTotalCalories(food.ingredients)}</p>
                            <p className="text-xs uppercase tracking-[0.08em] text-[#6A994E]">Calories</p>
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-semibold text-[#1D2D00]">Ingredients</p>
                          <div className="flex flex-wrap gap-1.5">
                            {food.ingredients.slice(0, 3).map((ingredient, index) => (
                              <span
                                key={index}
                                className="rounded-full border border-[#90CD1D]/50 bg-[#F8FAF4] px-2.5 py-1 text-xs font-medium text-[#6A994E]"
                              >
                                {ingredient.ingredient_name}
                              </span>
                            ))}
                            {food.ingredients.length > 3 && (
                              <span className="rounded-full bg-[#F8FAF4] px-2.5 py-1 text-xs font-semibold text-[#6A994E]">
                                +{food.ingredients.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {food.allergies && (
                          <div>
                            <p className="mb-2 text-sm font-semibold text-[#1D2D00]">Allergens</p>
                            <div className="flex flex-wrap gap-1.5">
                              {getAllergiesArray(food.allergies).map((allergy, index) => (
                                <span
                                  key={index}
                                  className="rounded-full border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-2.5 py-1 text-xs font-medium text-[#E74C3C]"
                                >
                                  {allergy}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </main>
    </div>
  );
}