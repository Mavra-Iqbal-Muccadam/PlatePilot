'use client';

import { useState, useEffect } from 'react';

interface MealCalorie {
  name: string;
  calories: number;
}

interface UserCalory {
  id: number;
  user_id: number;
  current_calory: number;
  limit_calory: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  created_at: string;
}

export default function SimpleCalorieCounter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [meals, setMeals] = useState<MealCalorie[]>([
    { name: 'Breakfast', calories: 0 },
    { name: 'Lunch', calories: 0 },
    { name: 'Dinner', calories: 0 },
  ]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [newLimit, setNewLimit] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isExceeded, setIsExceeded] = useState(false);

  useEffect(() => {
    // Get user ID from localStorage
    const userData = localStorage.getItem('userData');
    console.log('[SimpleCalorieCounter] userData from localStorage:', userData);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('[SimpleCalorieCounter] Parsed user:', user);
        setUserId(user.id);
      } catch (error) {
        console.error('[SimpleCalorieCounter] Error parsing user data:', error);
      }
    } else {
      console.log('[SimpleCalorieCounter] No userData in localStorage');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      console.log('[SimpleCalorieCounter] No userId, skipping fetch');
      return;
    }

    console.log('[SimpleCalorieCounter] Fetching calory data for userId:', userId);
    const fetchCaloryData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user-calory?userId=${userId}`);
        const result = await response.json();

        console.log('[SimpleCalorieCounter] Calory data response:', result);

        if (result.success && result.data) {
          const data: UserCalory = result.data;
          const currentCal = Number(data.current_calory) || 0;
          const limitCal = Number(data.limit_calory) || 2000;
          
          setTotalCalories(currentCal);
          setDailyLimit(limitCal);
          setIsExceeded(currentCal > limitCal);
          
          setMeals([
            { name: 'Breakfast', calories: Number(data.breakfast) || 0 },
            { name: 'Lunch', calories: Number(data.lunch) || 0 },
            { name: 'Dinner', calories: Number(data.dinner) || 0 },
          ]);
        }
      } catch (error) {
        console.error('[SimpleCalorieCounter] Error fetching calory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCaloryData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCaloryData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleSetLimit = async () => {
    if (!newLimit || !userId) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/user-calory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          limit_calory: parseInt(newLimit),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setDailyLimit(parseInt(newLimit));
        setShowLimitModal(false);
        setNewLimit('');
      }
    } catch (error) {
      console.error('Error setting limit:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleReset = async () => {
    if (!userId || !confirm('Are you sure you want to reset calories to 0?')) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/user-calory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          current_calory: 0,
          breakfast: 0,
          lunch: 0,
          dinner: 0,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setTotalCalories(0);
        setMeals([
          { name: 'Breakfast', calories: 0 },
          { name: 'Lunch', calories: 0 },
          { name: 'Dinner', calories: 0 },
        ]);
      }
    } catch (error) {
      console.error('Error resetting calories:', error);
    } finally {
      setUpdating(false);
    }
  };

  const progressPercentage = (totalCalories / dailyLimit) * 100;

  const getProgressColor = () => {
    if (progressPercentage >= 100) return '#EF4444'; // red
    if (progressPercentage >= 80) return '#F97316'; // orange
    if (progressPercentage >= 60) return '#EAB308'; // yellow
    return '#22C55E'; // green
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Compact View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-white rounded-2xl shadow-lg p-6 w-32 text-center hover:shadow-xl transition-shadow cursor-pointer border border-gray-200"
        >
          <div className="text-xs font-semibold text-gray-600 mb-3">CALORIE</div>
          <div className="text-xs font-semibold text-gray-600">COUNTER</div>
          
          {/* Circular Progress */}
          <div className="relative w-24 h-24 mx-auto mt-4 mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getProgressColor()}
                strokeWidth="8"
                strokeDasharray={`${(progressPercentage / 100) * 282.7} 282.7`}
                strokeLinecap="round"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {totalCalories}
                </div>
                <div className="text-xs text-gray-500">cal</div>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 border border-gray-200">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-600">CALORIE</div>
              <div className="text-sm font-semibold text-gray-600">COUNTER</div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Circular Progress - Larger */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getProgressColor()}
                strokeWidth="8"
                strokeDasharray={`${(progressPercentage / 100) * 282.7} 282.7`}
                strokeLinecap="round"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {totalCalories.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  of {dailyLimit.toLocaleString()} cal
                </div>
              </div>
            </div>
          </div>

          {/* Meals List */}
          <div className="space-y-3 mb-4">
            {meals.map((meal, index) => (
              <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-200 last:border-b-0">
                <span className="text-gray-700 font-medium">{meal.name}</span>
                <span className="text-gray-900 font-semibold">{meal.calories}</span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(progressPercentage, 100)}%`,
                  backgroundColor: getProgressColor(),
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            {totalCalories > dailyLimit ? (
              <div className="text-red-600 font-semibold text-sm">
                ⚠️ Over limit by {totalCalories - dailyLimit} cal
              </div>
            ) : (
              <div className="text-green-600 font-semibold text-sm">
                ✓ {dailyLimit - totalCalories} cal remaining
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button 
              onClick={() => setShowLimitModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-colors"
            >
              Set Limit
            </button>
            <button 
              onClick={handleReset}
              disabled={updating}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {updating ? 'Resetting...' : 'Reset'}
            </button>
          </div>

          {/* Suggest Diet Plan Button - Only show if exceeded */}
          {isExceeded && (
            <button
              onClick={() => window.location.href = '/diet-plan'}
              className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Suggest Diet Plan
            </button>
          )}

          {/* Set Limit Modal */}
          {showLimitModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
              <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Set Daily Limit</h3>
                
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder={dailyLimit.toString()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  min="500"
                  max="10000"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowLimitModal(false);
                      setNewLimit('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetLimit}
                    disabled={!newLimit || updating}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
