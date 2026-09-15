"use client";

import { useState, useEffect } from "react";

interface MealCalorie {
  name: string;
  calories: number;
}
interface UserCalory {
  current_calory: number;
  limit_calory: number;
  breakfast: number;
  lunch: number;
  dinner: number;
}

export default function CaloriePanel() {
  const [meals, setMeals] = useState<MealCalorie[]>([
    { name: "Breakfast", calories: 0 },
    { name: "Lunch", calories: 0 },
    { name: "Dinner", calories: 0 },
  ]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(2000);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [showLimit, setShowLimit] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("userData") || "{}");
      if (u?.id) setUserId(u.id);
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user-calory?userId=${userId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const d: UserCalory = data.data;
          setTotal(Number(d.current_calory) || 0);
          setLimit(Number(d.limit_calory) || 2000);
          setMeals([
            { name: "Breakfast", calories: Number(d.breakfast) || 0 },
            { name: "Lunch", calories: Number(d.lunch) || 0 },
            { name: "Dinner", calories: Number(d.dinner) || 0 },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetch_();
    const t = setInterval(fetch_, 30000);
    return () => clearInterval(t);
  }, [userId]);

  const handleSetLimit = async () => {
    if (!newLimit || !userId) return;
    setUpdating(true);
    try {
      await fetch("/api/user-calory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, limit_calory: parseInt(newLimit) }),
      });
      setLimit(parseInt(newLimit));
      setShowLimit(false);
      setNewLimit("");
    } finally {
      setUpdating(false);
    }
  };

  const handleReset = async () => {
    if (!userId) return;
    setUpdating(true);
    try {
      await fetch("/api/user-calory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          current_calory: 0,
          breakfast: 0,
          lunch: 0,
          dinner: 0,
        }),
      });
      setTotal(0);
      setMeals([
        { name: "Breakfast", calories: 0 },
        { name: "Lunch", calories: 0 },
        { name: "Dinner", calories: 0 },
      ]);
      setShowResetConfirmModal(false);
    } finally {
      setUpdating(false);
    }
  };

  const pct = Math.min((total / limit) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeColor =
    pct >= 100
      ? "#EF4444"
      : pct >= 80
        ? "#F97316"
        : pct >= 60
          ? "#EAB308"
          : "#22C55E";
  const exceeded = total > limit;

  if (loading)
    return (
      <div className="flex items-center justify-center p-10">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
      </div>
    );

  return (
    <div className="p-5 space-y-5">
      {/* Ring */}
      <div className="flex flex-col items-center">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#1D2D00]">
              {total.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">
              of {limit.toLocaleString()} cal
            </span>
          </div>
        </div>

        {/* Status pill */}
        <span
          className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${exceeded ? "bg-red-50 text-red-600" : "bg-[#E8F0D7] text-[#386641]"}`}
        >
          {exceeded
            ? `⚠️ Over by ${total - limit} cal`
            : `✓ ${limit - total} cal remaining`}
        </span>
      </div>

      {/* Meals */}
      <div className="rounded-xl border border-[#E8F0D7] bg-[#FAFCF7] divide-y divide-[#E8F0D7]">
        {meals.map((m) => (
          <div
            key={m.name}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm font-medium text-[#1D2D00]">{m.name}</span>
            <span className="text-sm font-bold text-[#386641]">
              {m.calories} cal
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-gray-400">
          <span>Daily progress</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: strokeColor }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowLimit(true)}
          className="rounded-xl bg-[#386641] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D2D00]"
        >
          Set Limit
        </button>
        <button
          onClick={() => setShowResetConfirmModal(true)}
          disabled={updating}
          className="rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {updating ? "Resetting…" : "Reset"}
        </button>
      </div>

      {exceeded && (
        <button
          onClick={() => (window.location.href = "/diet-plan")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D2D00] py-3 text-sm font-semibold text-[#90CD1D] transition-colors hover:bg-[#386641]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Suggest Diet Plan
        </button>
      )}

      {/* Set limit modal */}
      {showLimit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl">
            <p className="mb-4 font-bold text-[#1D2D00]">Set Daily Limit</p>
            <input
              type="number"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder={limit.toString()}
              min="500"
              max="10000"
              className="mb-4 w-full rounded-xl border border-[#C8DFA0] px-4 py-2.5 text-sm focus:border-[#90CD1D] focus:outline-none focus:ring-2 focus:ring-[#90CD1D]/20"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowLimit(false);
                  setNewLimit("");
                }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetLimit}
                disabled={!newLimit || updating}
                className="flex-1 rounded-xl bg-[#386641] py-2.5 text-sm font-semibold text-white hover:bg-[#1D2D00] disabled:bg-gray-300"
              >
                {updating ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl">
            {/* Icon and Title */}
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F0D7]">
                <span className="text-2xl">🔄</span>
              </div>
            </div>

            <h3 className="mb-2 text-center text-lg font-bold text-[#386641]">
              Reset Calories?
            </h3>

            {/* Message Content */}
            <div className="mb-6 rounded-lg border border-[#C8DFA0] bg-[#FAFCF7] p-4">
              <p className="text-center text-sm text-[#386641]">
                Are you sure you want to reset all calories to 0? This action
                cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 rounded-xl border border-[#C8DFA0] py-2.5 text-sm font-semibold text-[#386641] transition-colors hover:bg-[#F4F9EA]"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={updating}
                className="flex-1 rounded-xl bg-[#386641] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D2D00] disabled:bg-[#A7C957]"
              >
                {updating ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
