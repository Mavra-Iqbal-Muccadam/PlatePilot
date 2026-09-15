'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

interface Ingredient {
  ingredient_name: string;
  calories_count: number;
  count: number; // How many times this ingredient appears
}

interface RestaurantData {
  id: string;
  name: string;
  email: string;
  registration_number: string;
}

export default function SustainableMeal() {
  const router = useRouter();
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [basket, setBasket] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Check JWT authentication
        const { ClientAuth } = await import('../../lib/auth/jwt-auth');
        
        if (!ClientAuth.isAuthenticated()) {
          router.push('/restaurent');
          return;
        }

        const token = ClientAuth.getToken();
        if (token) {
          // Decode token to get user data
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('JWT Payload:', payload);
          const restaurantInfo = {
            id: payload.userId,
            name: payload.restaurantName,
            email: payload.email,
            registration_number: payload.registrationNumber
          };
          console.log('Restaurant Info:', restaurantInfo);
          setRestaurantData(restaurantInfo);

          // Fetch ingredients for this restaurant
          await fetchIngredients(payload.userId);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/restaurent');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  const fetchIngredients = async (restaurantId: string) => {
    try {
      console.log('Fetching ingredients for restaurant ID:', restaurantId);
      const response = await fetch(`/api/restaurant-ingredients?restaurantId=${restaurantId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders())
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        console.log('Ingredients received:', data.ingredients?.length);
        console.log('Ingredients data:', data.ingredients);
        setIngredients(data.ingredients || []);
      } else {
        console.error('Failed to fetch ingredients, status:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const getAuthHeaders = async () => {
    const { ClientAuth } = await import('../../lib/auth/jwt-auth');
    return ClientAuth.getAuthHeaders();
  };

  const addToBasket = (ingredient: Ingredient) => {
    // Check if ingredient already exists in basket
    const existingItem = basket.find(item => item.ingredient_name === ingredient.ingredient_name);
    
    if (existingItem) {
      // If exists, increase count
      setBasket(basket.map(item => 
        item.ingredient_name === ingredient.ingredient_name 
          ? { ...item, count: item.count + 1 }
          : item
      ));
    } else {
      // If doesn't exist, add new item with count 1
      setBasket([...basket, { ...ingredient, count: 1 }]);
    }
  };

  const removeFromBasket = (ingredientName: string) => {
    const existingItem = basket.find(item => item.ingredient_name === ingredientName);
    
    if (existingItem && existingItem.count > 1) {
      // If count > 1, decrease count
      setBasket(basket.map(item => 
        item.ingredient_name === ingredientName 
          ? { ...item, count: item.count - 1 }
          : item
      ));
    } else {
      // If count = 1, remove item completely
      setBasket(basket.filter(item => item.ingredient_name !== ingredientName));
    }
  };

  const clearBasket = () => {
    setBasket([]);
  };

  const generateSustainableDish = async () => {
    if (basket.length === 0) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-sustainable-dish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders())
        },
        body: JSON.stringify({
          ingredients: basket
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Store the generated dish data in localStorage for the results page
        localStorage.setItem('generatedDish', JSON.stringify(data.dish));
        // Navigate to results page
        router.push('/sustainable-results');
      } else {
        console.error('Failed to generate dish:', data.error);
        alert('Failed to generate dish. Please try again.');
      }
    } catch (error) {
      console.error('Error generating dish:', error);
      alert('An error occurred while generating the dish.');
    } finally {
      setGenerating(false);
    }
  };

  const getCircleSize = (count: number, maxCount: number) => {
    const minSize = 120;
    const maxSize = 180;
    if (maxCount === 1) return 150; // If all ingredients have same count, use medium size
    const ratio = count / maxCount;
    return Math.max(minSize, minSize + (maxSize - minSize) * ratio);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#90CD1D] border-b-[#1D2D00]"></div>
      </div>
    );
  }

  const maxCount = Math.max(...ingredients.map(ing => ing.count), 1);
  const totalBasketItems = basket.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAF4] text-[#386641]`}>
      <header className="border-b border-[#90CD1D]/30 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A994E]">Sustainable Kitchen</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1D2D00]">Restaurant Ingredients</h1>
            <p className="mt-1 text-sm text-[#6A994E]">{restaurantData?.name} · Build eco-smart recipes from available ingredients.</p>
          </div>
          <button
            onClick={() => router.push('/restaurent-dashboard')}
            className="rounded-xl border border-[#90CD1D]/35 bg-[#386641] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#6A994E]"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {ingredients.length === 0 ? (
          <section className="rounded-[22px] border border-[#90CD1D]/30 bg-white px-6 py-16 text-center shadow-[0_18px_34px_rgba(144,205,29,0.12)]">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#90CD1D] to-[#6A994E]">
              <svg className="h-11 w-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#1D2D00]">No Ingredients Found</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-[#6A994E]">Add menu items first so we can analyze and reuse ingredients for sustainable dish generation.</p>
            <button
              onClick={() => router.push('/add-food')}
              className="mt-8 rounded-xl bg-[#386641] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(56,102,65,0.25)] transition-all hover:scale-[1.02] hover:bg-[#6A994E]"
            >
              Add Food Items
            </button>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[22px] border border-[#90CD1D]/30 bg-white p-6 shadow-[0_18px_34px_rgba(144,205,29,0.12)] sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#1D2D00]">Ingredient Workspace</h2>
                  <p className="mt-1 text-sm text-[#6A994E]">Tap any ingredient to add it into your generation basket.</p>
                </div>
                <p className="rounded-full border border-[#90CD1D]/45 bg-[#F8FAF4]/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6A994E]">
                  {ingredients.length} ingredients
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ingredients.map((ingredient, index) => {
                  const size = Math.min(130, Math.max(94, getCircleSize(ingredient.count, maxCount) - 24));
                  return (
                    <button
                      type="button"
                      key={`${ingredient.ingredient_name}-${index}`}
                      onClick={() => addToBasket(ingredient)}
                      className="group rounded-2xl border border-[#90CD1D]/45 bg-[#F8FAF4]/45 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#90CD1D]/45 hover:bg-[#F8FAF4]"
                    >
                      <div className="mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-[#90CD1D] to-[#6A994E] text-white shadow-[0_10px_24px_rgba(144,205,29,0.35)] transition-all group-hover:scale-105" style={{ width: size, height: size }}>
                        <span className="max-w-[70%] text-center text-xs font-semibold leading-5">{ingredient.ingredient_name}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#1D2D00]">Used {ingredient.count}x</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#6A994E]">
                          {ingredient.calories_count} cal
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
              <section className="rounded-[22px] border border-[#90CD1D]/30 bg-white p-6 shadow-[0_18px_34px_rgba(144,205,29,0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-[#1D2D00]">Basket</h3>
                    <p className="mt-1 text-sm text-[#6A994E]">{basket.length} selected · {totalBasketItems} total units</p>
                  </div>
                  {basket.length > 0 && (
                    <button
                      onClick={clearBasket}
                      className="rounded-lg border border-[#E74C3C]/35 bg-[#E74C3C]/10 px-3 py-1.5 text-xs font-semibold text-[#E74C3C] transition-all hover:bg-[#E74C3C]/15"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {basket.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-[#90CD1D] px-4 py-8 text-center">
                    <p className="text-sm text-[#6A994E]">Select ingredients from the workspace to start building your dish.</p>
                  </div>
                ) : (
                  <ul className="mt-5 space-y-2">
                    {basket.map((item, index) => (
                      <li key={`basket-${item.ingredient_name}-${index}`} className="flex items-center justify-between rounded-xl border border-[#90CD1D]/45 bg-[#F8FAF4]/45 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-[#1D2D00]">{item.ingredient_name}</p>
                          <p className="text-xs text-[#6A994E]">{item.calories_count} cal each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromBasket(item.ingredient_name)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#E74C3C] text-white transition-all hover:bg-[#C0392B]"
                            aria-label={`Remove ${item.ingredient_name}`}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-[#1D2D00]">{item.count}</span>
                          <button
                            onClick={() => addToBasket(item)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#386641] text-white transition-all hover:bg-[#6A994E]"
                            aria-label={`Add ${item.ingredient_name}`}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-[22px] border border-[#90CD1D]/30 bg-white p-6 shadow-[0_18px_34px_rgba(144,205,29,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#386641] to-[#6A994E]">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364-.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[#1D2D00]">AI Recipe Generator</h3>
                    <p className="text-sm text-[#6A994E]">Generate a sustainable dish from your basket.</p>
                  </div>
                </div>

                <button
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                    basket.length === 0 || generating
                      ? 'cursor-not-allowed bg-gray-400 text-white opacity-60'
                      : 'bg-[#386641] text-white shadow-[0_10px_24px_rgba(56,102,65,0.3)] hover:bg-[#6A994E]'
                  }`}
                  disabled={basket.length === 0 || generating}
                  onClick={generateSustainableDish}
                >
                  {generating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate New Dish
                    </>
                  )}
                </button>
                {basket.length === 0 && (
                  <p className="mt-3 text-center text-xs text-[#6A994E]">Add ingredients to activate generation.</p>
                )}
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}