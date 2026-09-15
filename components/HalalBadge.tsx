'use client';

import { useState, useEffect } from 'react';
import { HalalVerifierService } from '../lib/services/halal-verifier';

interface HalalBadgeProps {
  dealId?: number;
  foodId?: number;
  onStatusChange?: (isHalal: boolean | null) => void;
}

/**
 * Decorator Pattern: Enhances deal/food cards with halal verification badge
 */
export default function HalalBadge({ dealId, foodId, onStatusChange }: HalalBadgeProps) {
  const itemId = dealId || foodId;
  const itemType = dealId ? 'deal' : 'food';
  
  const [status, setStatus] = useState<'loading' | 'halal' | 'not-halal' | 'unknown'>('unknown');
  const [isVerifying, setIsVerifying] = useState(false);
  const [tooltip, setTooltip] = useState('');

  console.log(`[HalalBadge] Mounted for ${itemType}Id: ${itemId}`);

  const verifierService = new HalalVerifierService();

  // Subscribe to halal status changes
  useEffect(() => {
    console.log(`[HalalBadge] useEffect running for ${itemType}Id: ${itemId}`);
    
    const observer = {
      onHalalStatusChanged: (id: number, isHalal: boolean | null) => {
        console.log(`[HalalBadge] Observer called - id: ${id}, isHalal: ${isHalal}`);
        if (id === itemId) {
          if (isHalal === true) {
            console.log(`[HalalBadge] Setting status to halal`);
            setStatus('halal');
            setTooltip('This item is halal');
          } else if (isHalal === false) {
            console.log(`[HalalBadge] Setting status to not-halal`);
            setStatus('not-halal');
            setTooltip('This item may not be halal');
          } else {
            console.log(`[HalalBadge] Setting status to unknown`);
            setStatus('unknown');
            setTooltip('Verification pending');
          }
          onStatusChange?.(isHalal);
        }
      },
    };

    verifierService.subscribe(itemId, observer);
    console.log(`[HalalBadge] Subscribed to observer for ${itemType}Id: ${itemId}`);

    // Check if already cached
    const cached = verifierService.getCachedVerification(itemId);
    console.log(`[HalalBadge] Cached verification:`, cached);
    if (cached) {
      if (cached.isHalal === true) {
        setStatus('halal');
        setTooltip('This item is halal');
      } else if (cached.isHalal === false) {
        setStatus('not-halal');
        setTooltip('This item may not be halal');
      }
    }

    return () => {
      console.log(`[HalalBadge] Unsubscribing from observer for ${itemType}Id: ${itemId}`);
      verifierService.unsubscribe(itemId, observer);
    };
  }, [itemId, itemType, onStatusChange]);

  const handleVerify = async () => {
    console.log(`[HalalBadge] handleVerify called for ${itemType}Id: ${itemId}`);
    setIsVerifying(true);
    setStatus('loading');
    
    try {
      console.log(`[HalalBadge] Starting halal verification for ${itemType} ${itemId}`);
      
      let result;
      if (itemType === 'deal' && dealId) {
        result = await verifierService.verifyDeal(dealId);
      } else if (itemType === 'food' && foodId) {
        result = await verifierService.verifyFood(foodId);
      } else {
        throw new Error('Invalid item type');
      }
      
      console.log('[HalalBadge] Halal verification result:', result);
      
      if (result.isHalal === true) {
        console.log('[HalalBadge] Result is halal');
        setStatus('halal');
        setTooltip(`Halal verified: ${result.reason}`);
      } else if (result.isHalal === false) {
        console.log('[HalalBadge] Result is not halal');
        setStatus('not-halal');
        setTooltip(`Not halal: ${result.reason}`);
      } else {
        console.log('[HalalBadge] Result is unknown');
        setStatus('unknown');
        setTooltip('Unable to verify');
      }
    } catch (error) {
      console.error('[HalalBadge] Error verifying halal status:', error);
      setStatus('unknown');
      setTooltip('Verification failed');
    } finally {
      console.log('[HalalBadge] Verification complete');
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleVerify}
        disabled={isVerifying}
        className={`
          flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
          ${status === 'halal' ? 'bg-green-100 hover:bg-green-200' : ''}
          ${status === 'not-halal' ? 'bg-red-100 hover:bg-red-200' : ''}
          ${status === 'loading' ? 'bg-yellow-100 animate-pulse' : ''}
          ${status === 'unknown' ? 'bg-gray-100 hover:bg-gray-200' : ''}
          border-2
          ${status === 'halal' ? 'border-green-400' : ''}
          ${status === 'not-halal' ? 'border-red-400' : ''}
          ${status === 'loading' ? 'border-yellow-400' : ''}
          ${status === 'unknown' ? 'border-gray-300' : ''}
          cursor-pointer disabled:opacity-50
        `}
        title={tooltip}
      >
        {status === 'halal' && (
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        
        {status === 'not-halal' && (
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
        
        {status === 'loading' && (
          <svg className="w-6 h-6 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {status === 'unknown' && (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {tooltip || 'Click to verify halal status'}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
}
