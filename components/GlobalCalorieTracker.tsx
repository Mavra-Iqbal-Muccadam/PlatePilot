'use client';

import { useEffect, useState } from 'react';
import EnhancedCalorieTracker from './EnhancedCalorieTracker';

export default function GlobalCalorieTracker() {
  const [userId, setUserId] = useState<number | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in and get user ID
    const checkUserAuth = () => {
      const userToken = localStorage.getItem('userToken');
      const userData = localStorage.getItem('userData');
      
      if (userToken && userToken.startsWith('user_') && userData) {
        try {
          const user = JSON.parse(userData);
          setUserId(user.id);
          setIsUserLoggedIn(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsUserLoggedIn(false);
        }
      } else {
        setIsUserLoggedIn(false);
      }
    };

    // Check on mount
    checkUserAuth();

    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = () => {
      checkUserAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkUserAuth, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Only show for logged-in users (not restaurants)
  if (!isUserLoggedIn || !userId) {
    return null;
  }

  return (
    <EnhancedCalorieTracker 
      userId={userId} 
      position="top-right"
      onLimitExceeded={(data) => {
        // Global limit exceeded handler
        console.log('🚨 Global calorie limit exceeded:', data);
        
        // Optional: Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Calorie Limit Exceeded!', {
            body: `You've consumed ${data.current_calories} calories today. Your limit is ${data.daily_limit} calories.`,
            icon: '/favicon.ico',
            tag: 'calorie-limit'
          });
        }
      }}
    />
  );
}