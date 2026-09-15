"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Loader from "../components/Loader";
import OrderCart from "../../components/OrderCart";
import GroceryList from "@/components/GroceryList";
import HalalBadge from "@/components/HalalBadge";
import MealAllergyChecker from "@/components/MealAllergyChecker";

interface Ingredient {
  id: number;
  ingredient_name: string;
  calories_count: number;
}

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  allergies: string;
  image_url?: string;
  enabled: boolean;
  ingredients: Ingredient[];
}

interface Restaurant {
  id: number;
  name: string;
  profile_pic?: string;
}

const stockFoodImages = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80",
];

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const sentenceCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const resolveFoodImage = (item: FoodItem): string => {
  if (item.image_url && /^(https?:\/\/|\/)/i.test(item.image_url)) {
    return item.image_url;
  }

  const seed = `${item.id}-${item.name}`;
  const hash = Array.from(seed).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  return stockFoodImages[hash % stockFoodImages.length];
};

const buildFoodDescription = (item: FoodItem): string => {
  const raw = normalizeWhitespace(item.description || "");
  const cleaned = normalizeWhitespace(raw.replace(/\s-\s[^-]{2,32}$/g, ""));

  if (cleaned.length >= 45 && cleaned.split(" ").length > 8) {
    return sentenceCase(cleaned.endsWith(".") ? cleaned : `${cleaned}.`);
  }

  const ingredientPreview = item.ingredients
    .map((ingredient) => ingredient.ingredient_name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  if (ingredientPreview) {
    return sentenceCase(
      `Prepared with ${ingredientPreview}, this meal offers satisfying flavor with mindful nutrition.`,
    );
  }

  return sentenceCase(
    "A carefully prepared healthy meal designed for balanced taste and wellness.",
  );
};

type AddToCartFn = (item: {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: "food" | "deal";
  image?: string;
  description?: string;
}) => Promise<void>;

export default function FoodDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("id");
  const foodIdParam = searchParams.get("foodId");

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [userId, setUserId] = useState<number | null>(null);
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [showMealTypeModal, setShowMealTypeModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<FoodItem | null>(null);
  const [updatingCalories, setUpdatingCalories] = useState(false);
  const [allergyStatus, setAllergyStatus] = useState<Map<number, boolean>>(
    new Map(),
  );

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUserId(parsed.id);
    }
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const fetchRestaurantMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/public-restaurant-menu?restaurantId=${restaurantId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        const result = await response.json();

        if (!result.success) {
          setMessage({
            type: "error",
            text: result.error || "Unable to load restaurant menu",
          });
          return;
        }

        setRestaurant(result.restaurant);
        setMenuItems(result.menuItems);

        localStorage.setItem(
          "selectedRestaurantId",
          String(result.restaurant.id),
        );
      } catch (error) {
        console.error(error);
        setMessage({
          type: "error",
          text: "Network error while loading food details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantMenu();
  }, [restaurantId]);

  // When foodIdParam or menuItems change, auto-select the target food
  useEffect(() => {
    if (!foodIdParam || menuItems.length === 0) return;
    const targetId = parseInt(foodIdParam, 10);
    const exists = menuItems.some(item => item.id === targetId);
    if (exists) setSelectedItemId(targetId);
  }, [foodIdParam, menuItems]);

  useEffect(() => {
    if (!message) return;

    const timeoutId = setTimeout(() => {
      setMessage(null);
    }, 2800);

    return () => clearTimeout(timeoutId);
  }, [message]);

  const selectedItem = useMemo(
    () => menuItems.find((item) => item.id === selectedItemId) ?? menuItems[0],
    [menuItems, selectedItemId],
  );

  const handleAddToCart = (item: FoodItem) => {
    if (!userId) {
      setMessage({
        type: "error",
        text: "Please log in to add items to cart.",
      });
      return;
    }

    if (!restaurantId) {
      setMessage({ type: "error", text: "Restaurant ID is missing." });
      return;
    }

    // Show calorie tracking modal first
    setPendingItem(item);
    setShowCalorieModal(true);
  };

  const handleCalorieYes = () => {
    setShowCalorieModal(false);
    setShowMealTypeModal(true);
  };

  const handleCalorieNo = () => {
    setShowCalorieModal(false);
    // Add to cart without tracking calories
    if (pendingItem) {
      addToCartOnly(pendingItem);
    }
  };

  const handleMealTypeSelect = async (
    mealType: "breakfast" | "lunch" | "dinner",
  ) => {
    if (!pendingItem || !userId) return;

    setUpdatingCalories(true);
    try {
      // Calculate total calories from ingredients
      const totalCalories = pendingItem.ingredients.reduce(
        (sum, ingredient) => sum + ingredient.calories_count,
        0,
      );

      // Fetch current user_calory data
      const getResponse = await fetch(`/api/user-calory?userId=${userId}`);
      const getData = await getResponse.json();

      if (getData.success && getData.data) {
        const currentData = getData.data;
        const newCurrentCalory =
          (Number(currentData.current_calory) || 0) + totalCalories;
        const newMealCalory =
          (Number(currentData[mealType]) || 0) + totalCalories;

        // Update with calculated values
        const updateResponse = await fetch("/api/user-calory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            current_calory: newCurrentCalory,
            [mealType]: newMealCalory,
          }),
        });

        const updateResult = await updateResponse.json();
        if (!updateResult.success) {
          console.error("Failed to update calories:", updateResult.error);
          setMessage({ type: "error", text: "Failed to update calorie count" });
        } else {
          // Store that this item should track calories with meal type info
          const trackedItems = JSON.parse(
            localStorage.getItem("trackedCalorieItems") || "{}",
          );
          trackedItems[`${restaurantId}_${pendingItem.id}`] = {
            calories: totalCalories,
            mealType: mealType,
            tracked: true,
          };
          localStorage.setItem(
            "trackedCalorieItems",
            JSON.stringify(trackedItems),
          );
        }
      }
    } catch (error) {
      console.error("Error updating calories:", error);
      setMessage({ type: "error", text: "Error updating calorie count" });
    } finally {
      setUpdatingCalories(false);
      setShowMealTypeModal(false);
      // Add to cart after calorie tracking
      if (pendingItem) {
        addToCartOnly(pendingItem);
      }
    }
  };

  const addToCartOnly = (item: FoodItem) => {
    const cartBridge = window as Window &
      Record<string, AddToCartFn | undefined>;
    const addToCartFunction = cartBridge[`addToCart_${restaurantId}`];
    if (!addToCartFunction) {
      setMessage({
        type: "error",
        text: "Cart service is not ready. Try again.",
      });
      return;
    }

    addToCartFunction({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      type: "food",
      image: item.image_url,
      description: item.description,
    });

    setMessage({ type: "success", text: `${item.name} added to cart.` });
    setPendingItem(null);
  };

  const addIngredientToGrocery = async (ingredient: Ingredient) => {
    if (!userId) {
      setMessage({
        type: "error",
        text: "Please log in to add items to grocery list.",
      });
      return;
    }

    try {
      const response = await fetch("/api/grocery/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ingredient_name: ingredient.ingredient_name,
          quantity: 1,
          unit: "piece",
          source_food_name: selectedItem?.name || "Unknown",
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({
          type: "success",
          text: `${ingredient.ingredient_name} added to grocery list!`,
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to add to grocery list",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error adding to grocery list" });
    }
  };

  const addAllIngredientsToGrocery = async (ingredients: Ingredient[]) => {
    if (!userId) {
      setMessage({
        type: "error",
        text: "Please log in to add items to grocery list.",
      });
      return;
    }

    try {
      for (const ingredient of ingredients) {
        await fetch("/api/grocery/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            ingredient_name: ingredient.ingredient_name,
            quantity: 1,
            unit: "piece",
            source_food_name: selectedItem?.name || "Unknown",
          }),
        });
      }
      setMessage({
        type: "success",
        text: `All ${ingredients.length} ingredients added to grocery list!`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error adding ingredients to grocery list",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF4]">
        <Navbar />
        <Loader label="Loading food details..." />
      </div>
    );
  }

  if (!restaurantId || !restaurant) {
    return (
      <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-2xl font-bold text-red-600">Restaurant not selected</h1>
            <p className="mt-2 text-sm text-red-500">Open this page from Menu to load a specific restaurant.</p>
            <button onClick={() => router.push("/all-foods")}
              className="mt-5 rounded-xl bg-[#1D2D00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
              Go to Menu
            </button>
          </div>
        </main>
      </div>
    );
  }

  const totalCal = selectedItem?.ingredients.reduce((s, i) => s + i.calories_count, 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-[#1D2D00]/50">
          <button onClick={() => router.push("/all-foods")} className="hover:text-[#386641]">Menu</button>
          <span>/</span>
          <span className="font-semibold text-[#1D2D00]">{restaurant.name}</span>
        </div>

        {/* Restaurant header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-10 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#90CD1D]/30 bg-[#E8F0D7]">
              {restaurant.profile_pic ? (
                <img src={restaurant.profile_pic} alt={restaurant.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#386641] to-[#1D2D00]">
                  <span className="text-2xl font-black text-[#90CD1D]">{restaurant.name[0]}</span>
                </div>
              )}
            </div>
            <div>
              <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                Restaurant Menu
              </span>
              <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">{restaurant.name}</h1>
              <p className="mt-1 text-sm text-white/50">{menuItems.length} items available</p>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* Left: selected item detail */}
          <div className="space-y-5">
            {selectedItem ? (
              <>
                {/* Image */}
                <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-[#E8F0D7] sm:h-80">
                  <img src={resolveFoodImage(selectedItem)} alt={selectedItem.name}
                    className="h-full w-full object-cover" />
                  {!selectedItem.enabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-[#1D2D00]">Currently Unavailable</span>
                    </div>
                  )}
                </div>

                {/* Title + price */}
                <div className="rounded-2xl border border-[#E8F0D7] bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-[#1D2D00]">{selectedItem.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-[#1D2D00]/60">{buildFoodDescription(selectedItem)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-[#1D2D00]">PKR {selectedItem.price.toFixed(0)}</p>
                      <div className="mt-1 flex justify-end">
                        <HalalBadge foodId={selectedItem.id} />
                      </div>
                    </div>
                  </div>

                  {totalCal > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="rounded-full bg-[#E8F0D7] px-3 py-1.5 text-xs font-semibold text-[#386641]">
                        🔥 {totalCal} kcal total
                      </span>
                      <span className="rounded-full bg-[#E8F0D7] px-3 py-1.5 text-xs font-semibold text-[#386641]">
                        🥗 {selectedItem.ingredients.length} ingredients
                      </span>
                    </div>
                  )}

                  {selectedItem.allergies && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-red-600"><span className="font-semibold">Allergens:</span> {selectedItem.allergies}</p>
                    </div>
                  )}

                  {userId && (
                    <div className="mt-4">
                      <MealAllergyChecker foodId={selectedItem.id} userId={userId}
                        onAllergyStatusChange={(isAllergic) => {
                          const s = new Map(allergyStatus);
                          s.set(selectedItem.id, isAllergic);
                          setAllergyStatus(s);
                        }} />
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleAddToCart(selectedItem)}
                      disabled={!selectedItem.enabled || allergyStatus.get(selectedItem.id)}
                      className="flex-1 rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#386641] disabled:cursor-not-allowed disabled:opacity-50">
                      {allergyStatus.get(selectedItem.id) ? "⚠️ Cannot Order (Allergic)" : selectedItem.enabled ? "Add to Cart" : "Unavailable"}
                    </button>
                    <button onClick={() => router.push("/my-orders")}
                      className="rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] px-5 py-3 text-sm font-semibold text-[#386641] transition-colors hover:bg-[#E8F0D7]">
                      Open Cart
                    </button>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="rounded-2xl border border-[#E8F0D7] bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1D2D00]">Ingredients & Nutrition</h3>
                    <button onClick={() => addAllIngredientsToGrocery(selectedItem.ingredients)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] px-3 py-1.5 text-xs font-semibold text-[#386641] transition-colors hover:bg-[#E8F0D7]">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add All to Grocery
                    </button>
                  </div>
                  {selectedItem.ingredients.length === 0 ? (
                    <p className="text-sm text-[#1D2D00]/40">No ingredient details available.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedItem.ingredients.map(ing => (
                        <div key={ing.id}
                          className="flex items-center justify-between rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] px-4 py-3">
                          <span className="text-sm font-medium text-[#1D2D00]">{ing.ingredient_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-[#E8F0D7] px-2.5 py-1 text-xs font-semibold text-[#386641]">
                              {ing.calories_count} kcal
                            </span>
                            <button onClick={() => addIngredientToGrocery(ing)}
                              className="rounded-lg border border-[#C8DFA0] bg-white px-2.5 py-1 text-xs font-medium text-[#386641] transition-colors hover:bg-[#E8F0D7]">
                              + Grocery
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-[#E8F0D7] bg-white p-12 text-center">
                <p className="text-[#1D2D00]/40">No menu items available.</p>
              </div>
            )}
          </div>

          {/* Right: item list */}
          <aside className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1D2D00]/50">
              All Items ({menuItems.length})
            </h3>
            {menuItems.map(item => (
              <button key={item.id} type="button" onClick={() => setSelectedItemId(item.id)}
                className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                  allergyStatus.get(item.id)
                    ? "border-red-200 bg-red-50"
                    : selectedItem?.id === item.id
                      ? "border-[#1D2D00] bg-[#E8F0D7] shadow-sm"
                      : "border-[#E8F0D7] bg-white hover:border-[#C8DFA0] hover:bg-[#F0F4E8]"
                }`}>
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#E8F0D7]">
                  <img src={resolveFoodImage(item)} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-[#1D2D00]">{item.name}</p>
                  <p className="text-xs text-[#1D2D00]/50">PKR {item.price.toFixed(0)}</p>
                  {!item.enabled && <span className="text-xs text-red-400">Unavailable</span>}
                </div>
                {allergyStatus.get(item.id) && <span className="text-base">⚠️</span>}
                {selectedItem?.id === item.id && <span className="h-2 w-2 shrink-0 rounded-full bg-[#90CD1D]" />}
              </button>
            ))}
          </aside>
        </div>
      </main>

      {userId && restaurantId && (
        <OrderCart restaurantId={Number(restaurantId)} restaurantName={restaurant.name}
          onOrderSuccess={orderId => setMessage({ type: "success", text: `Order #${orderId} placed successfully.` })}
          onOrderError={error => setMessage({ type: "error", text: error })} />
      )}

      {userId && <GroceryList userId={userId} />}

      {message && (
        <div className="fixed bottom-32 right-6 z-[1200] max-w-sm">
          <div className={`rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl ${
            message.type === "success"
              ? "border-[#90CD1D]/40 bg-[#1D2D00] text-[#D6F0A4]"
              : "border-red-300 bg-red-600 text-white"
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {showCalorieModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-black text-[#1D2D00]">Track Calories?</h3>
            <p className="mt-2 text-sm text-[#1D2D00]/60">
              Are you ordering <span className="font-semibold text-[#1D2D00]">{pendingItem?.name}</span> for yourself?
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

      {showMealTypeModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-black text-[#1D2D00]">Which meal?</h3>
            <p className="mt-2 text-sm text-[#1D2D00]/60">Select the meal type to track calories accurately.</p>
            <div className="mt-5 space-y-2.5">
              {([
                { type: "breakfast" as const, label: "🌅 Breakfast" },
                { type: "lunch" as const,     label: "🌞 Lunch"     },
                { type: "dinner" as const,    label: "🌙 Dinner"    },
              ]).map(m => (
                <button key={m.type} onClick={() => handleMealTypeSelect(m.type)} disabled={updatingCalories}
                  className="w-full rounded-xl bg-[#F0F4E8] py-3 text-sm font-semibold text-[#1D2D00] transition-colors hover:bg-[#E8F0D7] disabled:opacity-50">
                  {updatingCalories ? "Updating…" : m.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setShowMealTypeModal(false); setPendingItem(null); }} disabled={updatingCalories}
              className="mt-3 w-full rounded-xl border border-[#C8DFA0] py-2.5 text-sm text-[#1D2D00]/50 hover:bg-[#F0F4E8] disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
