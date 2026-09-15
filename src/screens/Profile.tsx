"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";
import AllergiesSelector from "../../components/AllergiesSelector";
import UserProfileEditor from "../../components/UserProfileEditor";
import { getReceiptItemsFromOrder, printReceipt } from "../../lib/receipt";
import { getFavourites, toggleFavourite } from "../../app/browse-deals/page";

interface UserData {
  id: number;
  username: string;
  email: string;
  profile_image?: string;
  age?: number;
  weight?: number;
  profession?: string;
}

interface Order {
  id: number;
  total_amount: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  created_at: string;
  delivery_address?: string;
  phone_number?: string;
  special_instructions?: string;
  restaurant_user?: { name: string } | null;
  order_items?: Array<{
    id: number; quantity: number; unit_price: number; total_price: number;
    item_type?: "food" | "deal";
    food?: { name: string; image_url?: string };
    deals?: { deal_name: string; description?: string };
  }>;
  order_deals?: Array<{
    id: number; quantity: number; unit_price: number; total_price: number;
    deals?: { deal_name: string; description?: string };
  }>;
}

const ORDERS_PER_PAGE = 5;

const statusStyle: Record<string, string> = {
  cancelled:  "bg-red-50 text-red-600 border-red-200",
  delivered:  "bg-[#E8F0D7] text-[#386641] border-[#C8DFA0]",
  ready:      "bg-blue-50 text-blue-700 border-blue-200",
  preparing:  "bg-amber-50 text-amber-700 border-amber-200",
  confirmed:  "bg-[#E8F0D7] text-[#1D2D00] border-[#C8DFA0]",
  pending:    "bg-[#F0F4E8] text-[#1D2D00] border-[#C8DFA0]",
};

// What the customer sees for each status
const statusLabel: Record<string, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  preparing: "Being Prepared",
  ready:     "Dispatched",
  delivered: "Completed",
  cancelled: "Cancelled",
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ordersUserId, setOrdersUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'favourites'>('orders');
  const [favouriteDeals, setFavouriteDeals] = useState<any[]>([]);
  const [favToast, setFavToast] = useState<string | null>(null);

  const fetchOrdersForUser = useCallback(async (uid: number) => {
    const token = localStorage.getItem("userToken");
    const res = await fetch(`/api/orders/user?user_id=${uid}`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const result = await res.json();
    if (result.success) setOrders(result.orders || []);
  }, []);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5MB."); return; }
    setUploading(true); setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file); formData.append("bucket", "user-pic");
      const token = localStorage.getItem("userToken");
      const res = await fetch("/api/upload-image", { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: formData });
      const result = await res.json();
      if (result.success && result.url) {
        const updated = { ...user, profile_image: result.url } as UserData;
        setUser(updated); localStorage.setItem("userData", JSON.stringify(updated));
      } else { setUploadError(`Failed: ${result.error || "Unknown error"}`); }
    } catch { setUploadError("Network error uploading image."); }
    finally { setUploading(false); }
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let visibilityHandler: (() => void) | null = null;
    const init = async () => {
      const token = localStorage.getItem("userToken");
      const localUserData = localStorage.getItem("userData");
      if (!token || !localUserData) { router.push("/user-login"); return; }
      const parsedUser = JSON.parse(localUserData);
      setUser(parsedUser);
      try {
        const profileRes = await fetch("/api/user-profile", { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
        const profileResult = await profileRes.json();
        if (profileResult.success) setUser(profileResult.user);
        const uid = Number(profileResult?.user?.id ?? parsedUser.id);
        setOrdersUserId(uid);
        await fetchOrdersForUser(uid);
        intervalId = setInterval(() => fetchOrdersForUser(uid).catch(console.error), 8000);
        visibilityHandler = () => { if (document.visibilityState === "visible") fetchOrdersForUser(uid).catch(console.error); };
        document.addEventListener("visibilitychange", visibilityHandler);
      } catch { setError("Some profile data could not be loaded."); }
      finally { setLoading(false); }
    };
    init();
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (visibilityHandler) document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [fetchOrdersForUser, router]);

  useEffect(() => {
    if (!ordersUserId) return;
    const onFocus = () => fetchOrdersForUser(ordersUserId).catch(console.error);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchOrdersForUser, ordersUserId]);

  // Load favourites and keep in sync
  useEffect(() => {
    const load = () => setFavouriteDeals(getFavourites());
    load();
    window.addEventListener('favouritesUpdated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('favouritesUpdated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  useEffect(() => {
    if (!favToast) return;
    const t = setTimeout(() => setFavToast(null), 2500);
    return () => clearTimeout(t);
  }, [favToast]);

  if (loading) return <div className="min-h-screen bg-[#F8FAF4]"><Navbar /><Loader label="Loading profile..." /></div>;
  if (!user) return null;

  // Pagination
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginatedOrders = orders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  const quickActions = [
    { title: "Menu",        subtitle: "Explore healthy meals",      href: "/all-foods",          icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
    { title: "Cart",        subtitle: "Checkout and track status",  href: "/my-orders",          icon: "M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5.4 5M7 13l-1.5 7H19M9 20a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z" },
    { title: "Restaurants", subtitle: "Browse by restaurant",       href: "/browse-restaurants", icon: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" },
    { title: "Deals",       subtitle: "Catch active bundle offers", href: "/browse-deals",       icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-10 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className="relative group">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#90CD1D]/40">
                {user.profile_image ? (
                  <img src={user.profile_image} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#386641] to-[#1D2D00]">
                    <span className="text-2xl font-black text-[#90CD1D]">{user.username[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <input type="file" accept="image/*" onChange={handleProfileImageUpload} disabled={uploading} className="hidden" />
                <span className="text-xs font-semibold text-white">{uploading ? "…" : "Change"}</span>
              </label>
            </div>
            <div>
              <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                My Account
              </span>
              <h1 className="mt-1 text-3xl font-black text-white">{user.username}</h1>
              <p className="text-sm text-white/50">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* ── Left: profile card ──────────────────────────────────── */}
          <div className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#E8F0D7] bg-white p-4 text-center">
                <p className="text-3xl font-black text-[#1D2D00]">{orders.length}</p>
                <p className="mt-0.5 text-xs text-[#1D2D00]/50">Total Orders</p>
              </div>
              <div className="rounded-2xl border border-[#E8F0D7] bg-white p-4 text-center">
                <p className="text-lg font-black capitalize text-[#1D2D00]">{statusLabel[orders[0]?.status] || orders[0]?.status || "—"}</p>
                <p className="mt-0.5 text-xs text-[#1D2D00]/50">Latest Status</p>
              </div>
            </div>

            {uploadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{uploadError}</div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {/* Allergies */}
            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-5">
              <AllergiesSelector userId={user.id} onAllergiesChange={() => {}} />
            </div>

            {/* Profile editor */}
            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-5">
              <UserProfileEditor
                userId={user.id}
                initialAge={user.age}
                initialWeight={user.weight}
                initialProfession={user.profession}
                onProfileUpdate={profile => {
                  const updated = { ...user, age: profile.age || user.age, weight: profile.weight || user.weight, profession: profile.profession || user.profession };
                  setUser(updated);
                  localStorage.setItem("userData", JSON.stringify(updated));
                }}
              />
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(a => (
                  <button key={a.title} onClick={() => router.push(a.href)}
                    className="rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] p-3 text-left transition-all hover:border-[#C8DFA0] hover:bg-[#F0F4E8]">
                    <svg className="mb-1.5 h-4 w-4 text-[#386641]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
                    </svg>
                    <p className="text-xs font-bold text-[#1D2D00]">{a.title}</p>
                    <p className="text-[10px] text-[#1D2D00]/50">{a.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: tabbed history ───────────────────────────────── */}
          <div>
            {/* Tab switcher */}
            <div className="mb-5 flex rounded-2xl border border-[#E8F0D7] bg-[#F0F4E8] p-1">
              {(['orders', 'favourites'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition-all duration-200 ${
                    activeTab === tab ? 'bg-[#1D2D00] text-white shadow-sm' : 'text-[#386641] hover:bg-[#E8F0D7]'
                  }`}>
                  {tab === 'orders' ? `Orders (${orders.length})` : `Favourites (${favouriteDeals.length})`}
                </button>
              ))}
            </div>

            {/* ── Orders tab ─────────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <>
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-[#E8F0D7] bg-white p-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0D7] text-2xl">🛒</div>
                    <p className="font-bold text-[#1D2D00]">No orders yet</p>
                    <p className="mt-1 text-sm text-[#1D2D00]/50">Start with a healthy meal from the menu.</p>
                    <button onClick={() => router.push("/all-foods")}
                      className="mt-4 rounded-xl bg-[#1D2D00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                  {paginatedOrders.map(order => (
                    <motion.div key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-[#E8F0D7] bg-white shadow-sm overflow-hidden">

                      {/* Order header */}
                      <button
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="flex w-full items-center justify-between p-5 text-left">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0D7] text-sm font-black text-[#386641]">
                            #{order.id}
                          </div>
                          <div>
                            <p className="font-bold text-[#1D2D00]">{order.restaurant_user?.name || "Restaurant"}</p>
                            <p className="text-xs text-[#1D2D00]/50">
                              {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyle[order.status] || statusStyle.pending}`}>
                            {statusLabel[order.status] || order.status}
                          </span>
                          <span className="font-black text-[#1D2D00]">PKR {order.total_amount.toFixed(0)}</span>
                          <svg className={`h-4 w-4 text-[#1D2D00]/40 transition-transform ${expandedOrderId === order.id ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded details */}
                      {expandedOrderId === order.id && (
                        <div className="border-t border-[#E8F0D7] px-5 pb-5 pt-4">
                          {/* Items */}
                          {(order.order_items?.length || order.order_deals?.length) ? (
                            <div className="mb-4 space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Items</p>
                              {order.order_items?.map(item => (
                                <div key={`food-${item.id}`} className="flex items-center justify-between rounded-xl bg-[#F8FAF4] px-4 py-2.5 text-sm">
                                  <span className="font-medium text-[#1D2D00]">{item.food?.name || item.deals?.deal_name || "Item"}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[#1D2D00]/50">×{item.quantity}</span>
                                    <span className="font-semibold text-[#1D2D00]">PKR {item.total_price.toFixed(0)}</span>
                                  </div>
                                </div>
                              ))}
                              {order.order_deals?.map(deal => (
                                <div key={`deal-${deal.id}`} className="flex items-center justify-between rounded-xl bg-[#F8FAF4] px-4 py-2.5 text-sm">
                                  <span className="font-medium text-[#1D2D00]">{deal.deals?.deal_name || "Deal"}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[#1D2D00]/50">×{deal.quantity}</span>
                                    <span className="font-semibold text-[#1D2D00]">PKR {deal.total_price.toFixed(0)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {/* Delivery info */}
                          {(order.delivery_address || order.phone_number) && (
                            <div className="mb-4 rounded-xl bg-[#F8FAF4] px-4 py-3 text-sm">
                              {order.delivery_address && <p className="text-[#1D2D00]/70"><span className="font-semibold text-[#1D2D00]">Address:</span> {order.delivery_address}</p>}
                              {order.phone_number && <p className="mt-1 text-[#1D2D00]/70"><span className="font-semibold text-[#1D2D00]">Phone:</span> {order.phone_number}</p>}
                              {order.special_instructions && <p className="mt-1 text-[#1D2D00]/70"><span className="font-semibold text-[#1D2D00]">Notes:</span> {order.special_instructions}</p>}
                            </div>
                          )}

                          <button
                            onClick={() => printReceipt({
                              orderId: order.id, status: order.status, totalAmount: order.total_amount,
                              createdAt: order.created_at, counterpartyLabel: "Restaurant",
                              counterpartyValue: order.restaurant_user?.name,
                              deliveryAddress: order.delivery_address, phoneNumber: order.phone_number,
                              specialInstructions: order.special_instructions, items: getReceiptItemsFromOrder(order),
                            })}
                            className="flex items-center gap-2 rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] px-4 py-2 text-xs font-semibold text-[#386641] transition-colors hover:bg-[#E8F0D7]">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Receipt
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-[#1D2D00]/50">
                      Page <span className="font-semibold text-[#1D2D00]">{currentPage}</span> of <span className="font-semibold text-[#1D2D00]">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C8DFA0] bg-white text-[#386641] transition-colors hover:bg-[#E8F0D7] disabled:opacity-40">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                            page === currentPage
                              ? "bg-[#1D2D00] text-white"
                              : "border border-[#C8DFA0] bg-white text-[#386641] hover:bg-[#E8F0D7]"
                          }`}>
                          {page}
                        </button>
                      ))}

                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C8DFA0] bg-white text-[#386641] transition-colors hover:bg-[#E8F0D7] disabled:opacity-40">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                  </>
                )}
              </>
            )}

            {/* ── Favourites tab ─────────────────────────────────────── */}
            {activeTab === 'favourites' && (
              <>
                {favToast && (
                  <div className="mb-4 rounded-xl border border-[#90CD1D]/40 bg-[#E8F0D7] px-4 py-3 text-sm font-semibold text-[#386641]">
                    {favToast}
                  </div>
                )}
                {favouriteDeals.length === 0 ? (
                  <div className="rounded-2xl border border-[#E8F0D7] bg-white p-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0D7] text-2xl">🤍</div>
                    <p className="font-bold text-[#1D2D00]">No favourites yet</p>
                    <p className="mt-1 text-sm text-[#1D2D00]/50">Tap the heart on any deal to save it here.</p>
                    <button onClick={() => router.push("/browse-deals")}
                      className="mt-4 rounded-xl bg-[#1D2D00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
                      Browse Deals
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favouriteDeals.map((deal: any) => (
                      <div key={deal.id} className="flex items-center gap-4 rounded-2xl border border-[#E8F0D7] bg-white p-4 shadow-sm">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#E8F0D7]">
                          <img src={[
                            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=80',
                            'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=200&q=80',
                            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=200&q=80',
                          ][deal.id % 3]} alt={deal.deal_name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-bold text-[#1D2D00]">{deal.deal_name}</p>
                          <p className="text-xs text-[#1D2D00]/50">{deal.restaurant?.name || 'Restaurant'}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-sm font-black text-[#1D2D00]">PKR {deal.deal_price?.toLocaleString()}</span>
                            {deal.savingsPercentage > 0 && (
                              <span className="rounded-full bg-[#E8F0D7] px-2 py-0.5 text-xs font-semibold text-[#386641]">{deal.savingsPercentage}% OFF</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => router.push(`/view-restaurant-deals?id=${deal.restaurant?.id || deal.id}`)}
                            className="rounded-xl bg-[#1D2D00] px-3 py-2 text-xs font-bold text-white hover:bg-[#386641]">
                            Order
                          </button>
                          <button
                            onClick={() => {
                              toggleFavourite(deal);
                              setFavouriteDeals(getFavourites());
                              setFavToast(`"${deal.deal_name}" removed from favourites`);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-400 hover:bg-red-100">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
