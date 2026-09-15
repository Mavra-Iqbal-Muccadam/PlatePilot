'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CartData, CartItemData, CartServiceFactory } from '../lib/services/cart-service';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: 'food' | 'deal';
  image?: string;
  description?: string;
  calories?: number;
}

interface OrderCartProps {
  restaurantId: number;
  restaurantName: string;
  onOrderSuccess?: (orderId: number) => void;
  onOrderError?: (error: string) => void;
}

function IconX() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function OrderCart({ restaurantId, restaurantName, onOrderSuccess, onOrderError }: OrderCartProps) {
  const router = useRouter();
  type CartWindow = Window & { [key: string]: ((item: CartItem) => Promise<void>) | undefined };
  const cartService = useMemo(() => CartServiceFactory.createService(), []);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [pendingItemId, setPendingItemId] = useState<number | null>(null);

  const loadCart = useCallback(async (uid: number, rid: number) => {
    setLoading(true);
    setError(null);
    try {
      const nextCart = await cartService.getCart(uid, rid);
      setCart(nextCart);
    } catch { setError('Failed to load cart data'); }
    finally { setLoading(false); }
  }, [cartService]);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) { const parsed = JSON.parse(userData); setUserId(parsed.id); }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadCart(userId, restaurantId);
  }, [loadCart, userId, restaurantId]);

  useEffect(() => {
    const cartWindow = window as unknown as CartWindow;
    cartWindow[`addToCart_${restaurantId}`] = async (item: CartItem) => {
      if (!userId) { const msg = 'Please log in to add items to cart'; setError(msg); onOrderError?.(msg); return; }
      const result = await cartService.addToCart(userId, restaurantId, {
        id: item.id, name: item.name, price: item.price, quantity: item.quantity,
        type: item.type, image: item.image, description: item.description,
      });
      if (!result.success) { const msg = result.error || 'Unable to add item to cart'; setError(msg); onOrderError?.(msg); return; }
      setCart(result.cart || null);
      setIsOpen(true);
      try {
        await fetch('/api/calorie-tracker', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, item: { id: item.id, name: item.name, total_calories: item.calories || 0, calories: item.calories || 0 }, sourceType: item.type || 'food', sourceId: item.id }),
        });
      } catch { /* calorie tracking failure is silent */ }
    };
    return () => { delete cartWindow[`addToCart_${restaurantId}`]; };
  }, [cartService, onOrderError, restaurantId, userId]);

  const updateQuantity = async (item: CartItemData, quantity: number) => {
    if (!item.id || !userId) return;
    try {
      setPendingItemId(item.id);
      await cartService.updateCartItem(item.id, quantity);
      await loadCart(userId, restaurantId);
    } catch { setError('Failed to update item quantity'); }
    finally { setPendingItemId(null); }
  };

  const removeItem = async (itemId: number) => {
    if (!userId) return;
    try {
      setPendingItemId(itemId);
      const itemToRemove = cart?.items.find(i => i.id === itemId);
      if (itemToRemove) {
        const trackedItems = JSON.parse(localStorage.getItem('trackedCalorieItems') || '{}');
        const itemKey = `${restaurantId}_${itemToRemove.food_id || itemToRemove.deal_id}`;
        const trackedItem = trackedItems[itemKey];
        if (trackedItem?.tracked && trackedItem.calories > 0) {
          fetch(`/api/user-calory?userId=${userId}`).then(r => r.json()).then(data => {
            if (data.success && data.data) {
              const updateObj: Record<string, unknown> = { userId, current_calory: Math.max(0, (Number(data.data.current_calory) || 0) - trackedItem.calories) };
              if (trackedItem.mealType && ['breakfast','lunch','dinner'].includes(trackedItem.mealType))
                updateObj[trackedItem.mealType] = Math.max(0, (Number(data.data[trackedItem.mealType]) || 0) - trackedItem.calories);
              fetch('/api/user-calory', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateObj) });
            }
          }).catch(console.error);
          delete trackedItems[itemKey];
          localStorage.setItem('trackedCalorieItems', JSON.stringify(trackedItems));
        }
      }
      await cartService.removeFromCart(itemId);
      await loadCart(userId, restaurantId);
    } catch { setError('Failed to remove item'); }
    finally { setPendingItemId(null); }
  };

  const cartItemCount = cart ? cart.items.reduce((c, i) => c + i.quantity, 0) : 0;
  const totalAmount = cart ? cartService.calculateCartTotal(cart) : 0;

  return (
    <>
      {/* Cart trigger — hidden, triggered by FloatingMenu */}
      <button
        onClick={() => setIsOpen(true)}
        className="sr-only"
        type="button"
        title="Open Cart"
        id="order-cart-trigger"
      >
        Cart
        {cartItemCount > 0 && (
          <span>{cartItemCount}</span>
        )}
      </button>

      {/* Slide-in panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)} />

            <motion.aside key="panel" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">

              {/* Header */}
              <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#1D2D00] to-[#386641] px-5 py-4">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 7H19M9 20a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                  <div>
                    <p className="font-bold leading-tight text-white">{restaurantName}</p>
                    <p className="text-xs text-white/55">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in cart</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                  <IconX />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {loading && (
                  <div className="flex justify-center py-10">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                {!loading && (!cart || !cart.items || cart.items.length === 0) && (
                  <div className="mt-8 rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] p-8 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0D7] text-2xl">🛒</div>
                    <p className="font-bold text-[#1D2D00]">Cart is empty</p>
                    <p className="mt-1 text-sm text-[#1D2D00]/50">Add a meal from this restaurant.</p>
                  </div>
                )}

                {!loading && cart && cart.items && cart.items.length > 0 && (
                  <div className="space-y-3">
                    {cart.items.map(item => (
                      <div key={item.id} className="rounded-2xl border border-[#E8F0D7] bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-[#1D2D00]">{item.item_name}</p>
                            <p className="text-xs text-[#1D2D00]/50">PKR {item.unit_price.toFixed(0)} each</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQuantity(item, item.quantity - 1)}
                              disabled={pendingItemId === item.id}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#C8DFA0] bg-[#F0F4E8] text-sm font-bold text-[#386641] hover:bg-[#E8F0D7] disabled:opacity-40">
                              −
                            </button>
                            <span className="min-w-[1.5rem] text-center text-sm font-bold text-[#1D2D00]">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item, item.quantity + 1)}
                              disabled={pendingItemId === item.id}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#C8DFA0] bg-[#F0F4E8] text-sm font-bold text-[#386641] hover:bg-[#E8F0D7] disabled:opacity-40">
                              +
                            </button>
                            <button onClick={() => removeItem(item.id!)}
                              disabled={pendingItemId === item.id}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end border-t border-[#E8F0D7] pt-2">
                          <span className="text-sm font-bold text-[#1D2D00]">PKR {(item.unit_price * item.quantity).toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!loading && cart && cart.items && cart.items.length > 0 && (
                <div className="shrink-0 border-t border-[#E8F0D7] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#1D2D00]/60">Total</span>
                    <span className="text-2xl font-black text-[#1D2D00]">PKR {totalAmount.toFixed(0)}</span>
                  </div>
                  <button
                    onClick={() => { localStorage.setItem('selectedRestaurantId', String(restaurantId)); setIsOpen(false); router.push('/my-orders'); }}
                    className="w-full rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#386641]">
                    Checkout →
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
