"use client";

import { useState, useEffect } from "react";

interface CalorieTrackerProps {
  userId: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  onLimitExceeded?: (data: any) => void;
}

interface CalorieData {
  userId: number;
  currentCalories: number;
  dailyLimit: number;
  limitExceeded: boolean;
  remainingCalories: number;
  caloriesAdded?: number;
  foodName?: string;
}

export default function CalorieTracker({
  userId,
  position = "top-right",
  onLimitExceeded,
}: CalorieTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trackerData, setTrackerData] = useState<CalorieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [showExceededAlert, setShowExceededAlert] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  // Position classes
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  // Load initial tracker data
  useEffect(() => {
    console.log("🔥 CalorieTracker: Loading data for user ID:", userId);
    loadTrackerData();
  }, [userId]);

  const loadTrackerData = async () => {
    console.log("🔥 CalorieTracker: loadTrackerData called for user:", userId);
    try {
      setLoading(true);
      const url = `/api/calorie-tracker?userId=${userId}`;
      console.log("🔥 CalorieTracker: Fetching from URL:", url);

      const response = await fetch(url);
      console.log("🔥 CalorieTracker: Response status:", response.status);

      const result = await response.json();
      console.log("🔥 CalorieTracker: Response data:", result);

      if (result.success) {
        console.log("🔥 CalorieTracker: Setting tracker data:", result.tracker);
        setTrackerData(result.tracker);
      } else {
        console.error(
          "🔥 CalorieTracker: Failed to load tracker data:",
          result.error,
        );
      }
    } catch (error) {
      console.error("🔥 CalorieTracker: Error loading tracker data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDailyLimit = async () => {
    if (!newLimit || isNaN(parseInt(newLimit))) return;

    try {
      setLoading(true);
      const response = await fetch("/api/calorie-tracker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dailyLimit: parseInt(newLimit),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTrackerData(result.tracker);
        setShowLimitModal(false);
        setNewLimit("");
      } else {
        alert("Failed to update limit: " + result.error);
      }
    } catch (error) {
      console.error("Error updating limit:", error);
      alert("Error updating limit");
    } finally {
      setLoading(false);
    }
  };

  const resetCalories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calorie-tracker?userId=${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setTrackerData(result.tracker);
        setShowResetConfirmModal(false);
      } else {
        alert("Failed to reset calories: " + result.error);
      }
    } catch (error) {
      console.error("Error resetting calories:", error);
      alert("Error resetting calories");
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = () => {
    if (!trackerData) return "bg-gray-400";

    const percentage =
      (trackerData.currentCalories / trackerData.dailyLimit) * 100;

    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressPercentage = () => {
    if (!trackerData) return 0;
    return Math.min(
      (trackerData.currentCalories / trackerData.dailyLimit) * 100,
      100,
    );
  };

  if (!trackerData && !loading) {
    console.log(
      "🔥 CalorieTracker: Not rendering - no data and not loading. TrackerData:",
      trackerData,
      "Loading:",
      loading,
    );
    return null;
  }

  console.log(
    "🔥 CalorieTracker: Rendering with data:",
    trackerData,
    "Loading:",
    loading,
  );

  return (
    <div>
      {/* Main Tracker Widget */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        {/* Compact View */}
        {!isExpanded && (
          <div
            onClick={() => setIsExpanded(true)}
            className="bg-white rounded-full shadow-2xl border-2 border-gray-200 p-3 cursor-pointer hover:shadow-3xl transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                {/* Circular Progress */}
                <svg
                  className="w-8 h-8 transform -rotate-90"
                  viewBox="0 0 32 32"
                >
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${getProgressPercentage() * 0.88} 88`}
                    className={getProgressColor().replace("bg-", "text-")}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold">🔥</span>
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-700">
                {trackerData?.currentCalories || 0}
              </div>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 max-w-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                🔥 Calorie Tracker
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : trackerData ? (
              <div>
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Today's Progress</span>
                    <span>
                      {trackerData.currentCalories} / {trackerData.dailyLimit}{" "}
                      cal
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{trackerData.dailyLimit}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {trackerData.remainingCalories}
                    </div>
                    <div className="text-xs text-blue-500">Remaining</div>
                  </div>
                  <div
                    className={`rounded-lg p-3 text-center ${
                      trackerData.limitExceeded ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    <div
                      className={`text-lg font-bold ${
                        trackerData.limitExceeded
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {Math.round(getProgressPercentage())}%
                    </div>
                    <div
                      className={`text-xs ${
                        trackerData.limitExceeded
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {trackerData.limitExceeded ? "Exceeded" : "Used"}
                    </div>
                  </div>
                </div>

                {/* Recently Added */}
                {recentlyAdded && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-2 mb-4 text-sm text-green-700">
                    ✅ {recentlyAdded}
                  </div>
                )}

                {/* Limit Exceeded Warning */}
                {trackerData.limitExceeded && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <div className="font-semibold text-sm">
                          Daily Limit Exceeded!
                        </div>
                        <div className="text-xs">
                          You've consumed{" "}
                          {trackerData.currentCalories - trackerData.dailyLimit}{" "}
                          calories over your limit.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLimitModal(true)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                  >
                    Set Limit
                  </button>
                  <button
                    onClick={() => setShowResetConfirmModal(true)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Set Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-80 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Set Daily Calorie Limit
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Limit (calories)
              </label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder={trackerData?.dailyLimit.toString() || "2000"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="500"
                max="10000"
              />
              <div className="text-xs text-gray-500 mt-1">
                Recommended: 1500-3000 calories per day
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  setNewLimit("");
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateDailyLimit}
                disabled={!newLimit || loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Exceeded Alert - Modal */}
      {showExceededAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-2xl p-6 w-80 max-w-sm mx-4 shadow-2xl">
            {/* Icon and Title */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
              Daily Limit Exceeded!
            </h3>

            {/* Message Content */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 text-center">
                You've consumed{" "}
                <span className="font-bold">
                  {trackerData?.currentCalories && trackerData?.dailyLimit
                    ? trackerData.currentCalories - trackerData.dailyLimit
                    : 0}{" "}
                  calories
                </span>{" "}
                over your daily limit of{" "}
                <span className="font-bold">{trackerData?.dailyLimit}</span>.
              </p>
              <p className="text-sm text-red-600 mt-3 text-center">
                Consider lighter options for your next meal.
              </p>
            </div>

            {/* Suggestion Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-700">
                <span className="font-semibold">💡 Tip:</span> You can update
                your daily calorie limit using the "Set Limit" button in the
                tracker.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowExceededAlert(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Got it, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-80 max-w-sm mx-4 shadow-2xl">
            {/* Icon and Title */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
              Reset Calories?
            </h3>

            {/* Message Content */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-700 text-center">
                Are you sure you want to reset all calories to 0? This action
                cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={resetCalories}
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2 px-4 rounded-lg transition-colors font-semibold"
              >
                {loading ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for easy integration with cart/order systems
export function useCalorieTracker(userId: number) {
  const addCaloriesFromFood = async (food: any, orderId?: number) => {
    try {
      const response = await fetch("/api/calorie-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          item: food,
          sourceType: "food",
          sourceId: food.id,
          orderId,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error adding calories from food:", error);
      return { success: false, error: "Failed to add calories" };
    }
  };

  const addCaloriesFromDeal = async (deal: any, orderId?: number) => {
    try {
      const response = await fetch("/api/calorie-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          item: deal,
          sourceType: "deal",
          sourceId: deal.id,
          orderId,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error adding calories from deal:", error);
      return { success: false, error: "Failed to add calories" };
    }
  };

  return {
    addCaloriesFromFood,
    addCaloriesFromDeal,
  };
}
