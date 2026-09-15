'use client';

import { useEffect, useState } from 'react';
import CalorieTracker from './CalorieTracker';
import { CalorieUpdateData } from '../lib/services/calorie-tracker-service';

interface UserLayoutProps {
  children: React.ReactNode;
  showCalorieTracker?: boolean;
}

export default function UserLayout({ children, showCalorieTracker = true }: UserLayoutProps) {
  const [userId, setUserId] = useState<number | null>(null);
  const [showLimitExceededNotification, setShowLimitExceededNotification] = useState(false);

  useEffect(() => {
    // Get user ID from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserId(user.id);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLimitExceeded = (data: CalorieUpdateData) => {
    // Show a beautiful notification when limit is exceeded
    setShowLimitExceededNotification(true);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      setShowLimitExceededNotification(false);
    }, 8000);

    // Optional: Play a sound notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Calorie Limit Exceeded!', {
        body: `You've consumed ${data.currentCalories} calories today. Your limit is ${data.dailyLimit} calories.`,
        icon: '/favicon.ico'
      });
    }
  };

  return (
    <div className="relative">
      {children}
      
      {/* Calorie Tracker - appears on every page for authenticated users */}
      {showCalorieTracker && userId && (
        <CalorieTracker 
          userId={userId} 
          position="top-right" 
          onLimitExceeded={handleLimitExceeded}
        />
      )}

      {/* Beautiful Limit Exceeded Notification */}
      {showLimitExceededNotification && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center transform animate-pulse">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Daily Calorie Limit Exceeded!
            </h2>
            <p className="text-gray-700 mb-6">
              You've reached your daily calorie goal. Consider choosing lighter options for your next meal or increasing your physical activity.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitExceededNotification(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-colors"
              >
                Got it
              </button>
              <button
                onClick={() => {
                  setShowLimitExceededNotification(false);
                  // You could navigate to a healthy recipes page or exercise suggestions
                  window.open('/make-healthy', '_blank');
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

// Hook to automatically add calories when orders are placed
export function useAutoCalorieTracking(userId: number) {
  const addCaloriesFromOrder = async (orderItems: any[], orderId: number) => {
    try {
      // Process each item in the order
      for (const item of orderItems) {
        let response;
        
        if (item.item_type === 'food' && item.food_id) {
          // Add calories from food item
          response = await fetch('/api/calorie-tracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              item: {
                id: item.food_id,
                name: item.item_name,
                total_calories: item.food?.total_calories || 0,
                calories: item.food?.total_calories || 0
              },
              sourceType: 'food',
              sourceId: item.food_id,
              orderId
            })
          });
        } else if (item.item_type === 'deal' && item.deal_id) {
          // Add calories from deal
          response = await fetch('/api/calorie-tracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              item: {
                id: item.deal_id,
                name: item.item_name,
                total_calories: item.deal?.total_calories || 0,
                calories: item.deal?.total_calories || 0
              },
              sourceType: 'deal',
              sourceId: item.deal_id,
              orderId
            })
          });
        }

        if (response) {
          const result = await response.json();
          if (!result.success) {
            console.error('Failed to add calories for item:', item.item_name, result.error);
          }
        }
      }
    } catch (error) {
      console.error('Error adding calories from order:', error);
    }
  };

  return { addCaloriesFromOrder };
}