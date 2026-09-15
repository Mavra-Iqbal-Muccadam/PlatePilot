"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";
import { CartData, CartServiceFactory } from "../../lib/services/cart-service";
import { printReceipt } from "../../lib/receipt";

interface OrderFormData {
  deliveryAddress: string;
  phoneNumber: string;
  specialInstructions: string;
}

export default function CartPage() {
  const router = useRouter();
  const cartService = useMemo(() => CartServiceFactory.createService(), []);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<number | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<{
    orderId: number;
    totalAmount: number;
    createdAt: string;
    restaurantName?: string;
    deliveryAddress?: string;
    phoneNumber?: string;
    specialInstructions?: string;
    items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  } | null>(null);
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    deliveryAddress: "",
    phoneNumber: "",
    specialInstructions: "",
  });

  const loadCart = useCallback(async (uid: number, rid: number) => {
    setLoading(true);
    setError(null);
    try {
      const cartData = await cartService.getCart(uid, rid);
      setCart(cartData);
    } catch {
      setError("Unable to load cart data.");
    } finally {
      setLoading(false);
    }
  }, [cartService]);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    const selectedRestaurantId = localStorage.getItem("selectedRestaurantId");
    if (!userData) { router.push("/user-login"); return; }
    const parsedUser = JSON.parse(userData);
    const uid = Number(parsedUser.id);
    const rid = selectedRestaurantId ? Number(selectedRestaurantId) : null;
    setUserId(uid);
    setRestaurantId(rid);
    if (!rid) { setLoading(false); setError("Select a restaurant from Food Details before opening cart."); return; }
    loadCart(uid, rid);
  }, [loadCart, router]);

  const totalAmount = cart ? cartService.calculateCartTotal(cart) : 0;

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (!userId || !restaurantId) return;
    try {
      setPendingItemId(itemId);
      await cartService.updateCartItem(itemId, quantity);
      await loadCart(userId, restaurantId);
    } catch { setError("Unable to update item quantity."); }
    finally { setPendingItemId(null); }
  };

  const handleRemove = async (itemId: number) => {
    if (!userId || !restaurantId) return;
    try {
      setPendingItemId(itemId);
      await cartService.removeFromCart(itemId);
      await loadCart(userId, restaurantId);
    } catch { setError("Unable to remove cart item."); }
    finally { setPendingItemId(null); }
  };

  const placeOrder = async () => {
    if (!userId || !restaurantId || !cart?.items?.length) { setError("No items in cart."); return; }
    try {
      setPlacingOrder(true);
      setError(null);
      const items = cart.items.map(item => ({
        id: item.item_type === "food" ? item.food_id! : item.deal_id!,
        name: item.item_name!,
        price: item.unit_price,
        quantity: item.quantity,
        type: item.item_type,
      }));
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("userToken") ? { Authorization: `Bearer ${localStorage.getItem("userToken")}` } : {}),
        },
        body: JSON.stringify({ userId, restaurantId, items, deliveryAddress: orderForm.deliveryAddress, phoneNumber: orderForm.phoneNumber, specialInstructions: orderForm.specialInstructions }),
      });
      const result = await response.json();
      if (!result.success) { setError(result.error || "Failed to place order."); return; }
      setLastPlacedOrder({
        orderId: result.orderId, totalAmount, createdAt: new Date().toISOString(),
        restaurantName: cart.restaurant_name, deliveryAddress: orderForm.deliveryAddress,
        phoneNumber: orderForm.phoneNumber, specialInstructions: orderForm.specialInstructions,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.price, totalPrice: i.price * i.quantity })),
      });
      await cartService.clearCart(cart.id);
      await loadCart(userId, restaurantId);
      setShowOrderForm(false);
      setOrderForm({ deliveryAddress: "", phoneNumber: "", specialInstructions: "" });
      setShowOrderSuccessPopup(true);
    } catch { setError("Network error while placing order."); }
    finally { setPlacingOrder(false); }
  };

  const inputClass = "w-full rounded-xl border border-[#C8DFA0] bg-white px-4 py-3 text-sm text-[#1D2D00] placeholder:text-[#1D2D00]/40 outline-none transition-all focus:border-[#90CD1D] focus:ring-2 focus:ring-[#90CD1D]/20";

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-10 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="relative">
            <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
              Checkout
            </span>
            <h1 className="mt-3 text-4xl font-black text-white">Your Cart</h1>
            <p className="mt-2 text-sm text-white/60">Review items, add delivery details, and place your order.</p>
          </div>
        </div>

        {loading && <Loader label="Loading cart..." />}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600">{error}</div>
        )}

        {!loading && !error && (!cart || !cart.items || cart.items.length === 0) && (
          <div className="rounded-3xl border border-[#E8F0D7] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0D7] text-3xl">🛒</div>
            <h2 className="text-xl font-bold text-[#1D2D00]">Your cart is empty</h2>
            <p className="mt-2 text-sm text-[#1D2D00]/50">Pick dishes from a restaurant menu or check active bundles.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => router.push("/all-foods")}
                className="rounded-xl bg-[#1D2D00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
                Browse Menu
              </button>
              <button onClick={() => router.push("/browse-deals")}
                className="rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] px-6 py-2.5 text-sm font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                Browse Deals
              </button>
            </div>
          </div>
        )}

        {!loading && cart && cart.items && cart.items.length > 0 && (
          <div className="space-y-4">
            {/* Cart items */}
            {cart.items.map((item, index) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="rounded-2xl border border-[#E8F0D7] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#1D2D00]">{item.item_name}</h3>
                      <span className="rounded-full bg-[#E8F0D7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#386641]">
                        {item.item_type}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-[#1D2D00]/50">PKR {item.unit_price.toFixed(0)} each</p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                      disabled={pendingItemId === item.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C8DFA0] bg-[#F0F4E8] text-[#386641] transition-colors hover:bg-[#E8F0D7] disabled:opacity-40">
                      −
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-bold text-[#1D2D00]">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                      disabled={pendingItemId === item.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C8DFA0] bg-[#F0F4E8] text-[#386641] transition-colors hover:bg-[#E8F0D7] disabled:opacity-40">
                      +
                    </button>
                    <button onClick={() => handleRemove(item.id!)}
                      disabled={pendingItemId === item.id}
                      className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-40">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex justify-end border-t border-[#E8F0D7] pt-3">
                  <span className="text-sm font-bold text-[#1D2D00]">
                    PKR {(item.unit_price * item.quantity).toFixed(0)}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Order summary */}
            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1D2D00]/60">Order Total</span>
                <span className="text-3xl font-black text-[#1D2D00]">PKR {totalAmount.toFixed(0)}</span>
              </div>

              {/* Delivery form */}
              <AnimatePresence>
                {showOrderForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 space-y-4 border-t border-[#E8F0D7] pt-5">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#386641]">Delivery Address</label>
                        <input type="text" value={orderForm.deliveryAddress}
                          onChange={e => setOrderForm(p => ({ ...p, deliveryAddress: e.target.value }))}
                          placeholder="Street, area, city" className={inputClass} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#386641]">Phone Number</label>
                        <input type="tel" value={orderForm.phoneNumber}
                          onChange={e => setOrderForm(p => ({ ...p, phoneNumber: e.target.value }))}
                          placeholder="Contact number" className={inputClass} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#386641]">Special Instructions <span className="normal-case font-normal text-[#1D2D00]/30">(optional)</span></label>
                        <textarea value={orderForm.specialInstructions}
                          onChange={e => setOrderForm(p => ({ ...p, specialInstructions: e.target.value }))}
                          rows={3} placeholder="Any notes for the restaurant…"
                          className={`${inputClass} resize-none`} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-[#E8F0D7] pt-5">
                {!showOrderForm ? (
                  <button onClick={() => setShowOrderForm(true)}
                    className="flex-1 rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#386641]">
                    Proceed to Order →
                  </button>
                ) : (
                  <>
                    <button onClick={() => setShowOrderForm(false)}
                      className="rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] px-5 py-3 text-sm font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                      Back
                    </button>
                    <button onClick={placeOrder}
                      disabled={placingOrder || !orderForm.deliveryAddress || !orderForm.phoneNumber}
                      className="flex-1 rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#386641] disabled:cursor-not-allowed disabled:opacity-50">
                      {placingOrder ? "Placing order…" : "Place Order"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Order success modal */}
      <AnimatePresence>
        {showOrderSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
            onClick={() => setShowOrderSuccessPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0D7]">
                <svg className="h-7 w-7 text-[#386641]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-[#1D2D00]">Order Placed!</h3>
              <p className="mt-2 text-sm text-[#1D2D00]/60">
                Your order #{lastPlacedOrder?.orderId} has been sent to the restaurant.
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowOrderSuccessPopup(false)}
                  className="flex-1 rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] py-3 text-sm font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                  Close
                </button>
                <button
                  onClick={() => {
                    if (!lastPlacedOrder) return;
                    printReceipt({
                      orderId: lastPlacedOrder.orderId, status: "pending",
                      totalAmount: lastPlacedOrder.totalAmount, createdAt: lastPlacedOrder.createdAt,
                      counterpartyLabel: "Restaurant", counterpartyValue: lastPlacedOrder.restaurantName || "Restaurant",
                      deliveryAddress: lastPlacedOrder.deliveryAddress, phoneNumber: lastPlacedOrder.phoneNumber,
                      specialInstructions: lastPlacedOrder.specialInstructions, items: lastPlacedOrder.items,
                    });
                  }}
                  className="flex-1 rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white hover:bg-[#386641]">
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
