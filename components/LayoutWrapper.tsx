'use client';

import { usePathname } from 'next/navigation';
import FloatingMenu from './FloatingMenu';

// Restaurant-side paths — no floating menu there
const RESTAURANT_PATHS = [
  '/restaurent',
  '/restaurent-dashboard',
  '/restaurant-orders',
  '/restaurant-menu',
  '/add-food',
  '/ai-deal-maker',
  '/view-deals',
  '/make-healthy',
  '/make-healthy-results',
  '/sustainable-meal',
  '/sustainable-results',
];

export default function LayoutWrapper() {
  const pathname = usePathname();
  const isRestaurant = RESTAURANT_PATHS.some(
    p => pathname === p || pathname.startsWith(p + '/')
  );
  if (isRestaurant) return null;
  return <FloatingMenu />;
}
