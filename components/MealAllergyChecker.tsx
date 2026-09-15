'use client';

import { useState, useEffect } from 'react';

interface MealAllergyCheckerProps {
  foodId: number;
  userId?: number;
  onAllergyStatusChange?: (isAllergic: boolean) => void;
}

export default function MealAllergyChecker({ foodId, userId, onAllergyStatusChange }: MealAllergyCheckerProps) {
  const [isAllergic, setIsAllergic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (userId) {
      checkAllergies();
    }
  }, [foodId, userId]);

  const checkAllergies = async () => {
    if (!userId) {
      console.log('[MealAllergyChecker] No userId provided, skipping allergy check');
      return;
    }

    try {
      setLoading(true);
      console.log(`[MealAllergyChecker] Checking allergies for foodId: ${foodId}, userId: ${userId}`);

      const response = await fetch('/api/check-meal-allergies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId, userId }),
      });

      const data = await response.json();
      console.log('[MealAllergyChecker] Response:', data);

      if (data.success) {
        console.log(`[MealAllergyChecker] Allergy check result - isAllergic: ${data.isAllergic}, reason: ${data.reason}`);
        setIsAllergic(data.isAllergic);
        setReason(data.reason);
        onAllergyStatusChange?.(data.isAllergic);
      } else {
        console.error('[MealAllergyChecker] Error:', data.error);
        setIsAllergic(false);
        onAllergyStatusChange?.(false);
      }
    } catch (error) {
      console.error('[MealAllergyChecker] Exception:', error);
      setIsAllergic(false);
      onAllergyStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if not allergic or still loading
  if (loading || isAllergic === null || !isAllergic) {
    console.log(`[MealAllergyChecker] Not rendering - loading: ${loading}, isAllergic: ${isAllergic}`);
    return null;
  }

  // Show red warning if allergic
  console.log('[MealAllergyChecker] Rendering allergy warning');
  return (
    <div className="mt-3 rounded-[12px] border-2 border-[#BC4749] bg-[#BC4749]/15 px-4 py-3">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-[#BC4749] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="font-semibold text-[#BC4749]">⚠️ You are allergic to this meal</p>
          <p className="text-sm text-[#BC4749]/80 mt-1">{reason}</p>
        </div>
      </div>
    </div>
  );
}
