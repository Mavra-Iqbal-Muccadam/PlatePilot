"use client";

import { useState, useEffect } from "react";

interface CalorieData {
  current_calories: number;
  daily_limit: number;
  limit_exceeded: boolean;
  remaining_calories: number;
}

interface EnhancedCalorieTrackerProps {
  userId: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  onLimitExceeded?: (data: CalorieData) => void;
}

export default function EnhancedCalorieTracker({
  userId,
  position = "top-right",
  onLimitExceeded,
}: EnhancedCalorieTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trackerData, setTrackerData] = useState<CalorieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [showExceededAlert, setShowExceededAlert] = useState(false);
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
    loadTrackerData();
    // Refresh every 30 seconds to catch updates from other sources
    const interval = setInterval(loadTrackerData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadTrackerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calorie-tracker?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        const newData = result.tracker;

        // Check if limit was just exceeded
        if (
          newData.limit_exceeded &&
          (!trackerData || !trackerData.limit_exceeded)
        ) {
          setShowExceededAlert(true);
          setTimeout(() => setShowExceededAlert(false), 8000);
          onLimitExceeded?.(newData);
        }

        setTrackerData(newData);
      } else {
        console.error("Failed to load tracker data:", result.error);
      }
    } catch (error) {
      console.error("Error loading tracker data:", error);
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
    if (!confirm("Are you sure you want to reset your daily calories to 0?"))
      return;

    try {
      setLoading(true);
      const response = await fetch(`/api/calorie-tracker?userId=${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setTrackerData(result.tracker);
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
      (trackerData.current_calories / trackerData.daily_limit) * 100;

    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressPercentage = () => {
    if (!trackerData) return 0;
    return Math.min(
      (trackerData.current_calories / trackerData.daily_limit) * 100,
      100,
    );
  };

  const getCalorieDisplayColor = () => {
    if (!trackerData) return "text-gray-700";

    const percentage =
      (trackerData.current_calories / trackerData.daily_limit) * 100;

    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-orange-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  if (!trackerData && !loading) return null;

  return (
    <div>
      {/* Main Tracker Widget - Enhanced Design */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        {/* Compact View - Bigger and More Prominent */}
        {!isExpanded && (
          <div
            onClick={() => setIsExpanded(true)}
            className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-4 cursor-pointer hover:shadow-3xl transition-all transform hover:scale-105 min-w-[120px]"
          >
            <div className="text-center">
              {/* Fire Icon */}
              <div className="text-2xl mb-1">🔥</div>

              {/* Big Calorie Number */}
              <div className={`text-2xl font-bold ${getCalorieDisplayColor()}`}>
                {trackerData?.current_calories || 0}
              </div>

              {/* Small "calories" text */}
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                calories
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>

              {/* Limit Info */}
              <div className="text-xs text-gray-400 mt-1">
                / {trackerData?.daily_limit || 2000}
              </div>
            </div>
          </div>
        )}

        {/* Expanded View - Enhanced */}
        {isExpanded && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-96 max-w-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  🔥 Daily Calories
                </h3>
                <p className="text-sm text-gray-500">Track your daily intake</p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading...</p>
              </div>
            ) : trackerData ? (
              <div>
                {/* Big Calorie Display */}
                <div className="text-center mb-6">
                  <div
                    className={`text-5xl font-bold ${getCalorieDisplayColor()}`}
                  >
                    {trackerData.current_calories}
                  </div>
                  <div className="text-lg text-gray-500">
                    of {trackerData.daily_limit} calories
                  </div>
                  <div className="text-sm text-gray-400">
                    {trackerData.remaining_calories} remaining
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${getProgressColor()}`}
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                    <span>{trackerData.daily_limit}</span>
                  </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div
                    className={`rounded-xl p-4 text-center ${
                      trackerData.limit_exceeded
                        ? "bg-red-50 border border-red-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <div
                      className={`text-2xl font-bold ${
                        trackerData.limit_exceeded
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {trackerData.limit_exceeded ? "⚠️" : "✅"}
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        trackerData.limit_exceeded
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      {trackerData.limit_exceeded ? "Over Limit" : "On Track"}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(getProgressPercentage())}%
                    </div>
                    <div className="text-sm font-medium text-blue-700">
                      Used Today
                    </div>
                  </div>
                </div>

                {/* Limit Exceeded Warning */}
                {trackerData.limit_exceeded && (
                  <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 text-red-700">
                      <span className="text-2xl">🚨</span>
                      <div>
                        <div className="font-bold text-lg">
                          Daily Limit Exceeded!
                        </div>
                        <div className="text-sm">
                          You've consumed{" "}
                          {trackerData.current_calories -
                            trackerData.daily_limit}{" "}
                          calories over your {trackerData.daily_limit} calorie
                          limit.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => setShowLimitModal(true)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
                  >
                    Set Limit
                  </button>
                  <button
                    onClick={resetCalories}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Test Button for Development */}
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/calorie-tracker/log", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId,
                          calories: 100,
                          foodName: "Test Food Item",
                          sourceType: "food",
                        }),
                      });

                      if (response.ok) {
                        loadTrackerData(); // Refresh data
                      }
                    } catch (error) {
                      console.error("Test add failed:", error);
                    }
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-xl text-sm font-semibold transition-colors"
                >
                  🧪 Test Add 100 Calories
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Set Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-96 max-w-sm mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Set Daily Calorie Limit
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Limit (calories)
              </label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder={trackerData?.daily_limit.toString() || "2000"}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                min="500"
                max="10000"
              />
              <div className="text-xs text-gray-500 mt-2">
                💡 Recommended: 1500-3000 calories per day
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  setNewLimit("");
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateDailyLimit}
                disabled={!newLimit || loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
              >
                {loading ? "Saving..." : "Save Limit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Limit Exceeded Alert */}
      {showExceededAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center transform animate-bounce">
            <div className="text-8xl mb-4">🚨</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">
              Calorie Limit Exceeded!
            </h2>
            <div className="text-lg text-gray-700 mb-2">
              <strong>{trackerData?.current_calories}</strong> /{" "}
              {trackerData?.daily_limit} calories
            </div>
            <p className="text-gray-600 mb-6">
              You've exceeded your daily calorie goal by{" "}
              <strong>
                {trackerData
                  ? trackerData.current_calories - trackerData.daily_limit
                  : 0}
              </strong>{" "}
              calories.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Consider choosing lighter options for your next meal or increasing
              your physical activity.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExceededAlert(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-colors"
              >
                Got it
              </button>
              <button
                onClick={() => {
                  setShowExceededAlert(false);
                  window.open("/make-healthy", "_blank");
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
              >
                Find Healthy Options
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
