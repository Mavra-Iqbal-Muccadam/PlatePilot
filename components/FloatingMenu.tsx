'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FoodSearchPanel from './FoodSearchPanel';
import HealthChatPanel from './HealthChatPanel';
import CaloriePanel from './CaloriePanel';

type Panel = 'food' | 'health' | 'calorie' | null;

const featurePills: { id: Panel; label: string; icon: React.ReactNode }[] = [
  {
    id: 'food',
    label: 'Food Search',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.15 6.15a7.5 7.5 0 0 0 10.5 10.5z" />
      </svg>
    ),
  },
  {
    id: 'health',
    label: 'Health Chat',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-3-3v6M5.636 5.636a9 9 0 1 0 12.728 12.728A9 9 0 0 0 5.636 5.636z" />
      </svg>
    ),
  },
  {
    id: 'calorie',
    label: 'Calorie Tracker',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 3v18h18M7 16l4-4 4 4 4-6" />
      </svg>
    ),
  },
];

const panelMeta: Record<NonNullable<Panel>, { icon: React.ReactNode; title: string; sub: string }> = {
  food: {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.15 6.15a7.5 7.5 0 0 0 10.5 10.5z" />
      </svg>
    ),
    title: 'Food Search',
    sub: "Describe a dish and I'll find it",
  },
  health: {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-3-3v6M5.636 5.636a9 9 0 1 0 12.728 12.728A9 9 0 0 0 5.636 5.636z" />
      </svg>
    ),
    title: 'Health Assistant',
    sub: 'Get personalised meal recommendations',
  },
  calorie: {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 3v18h18M7 16l4-4 4 4 4-6" />
      </svg>
    ),
    title: 'Calorie Tracker',
    sub: 'Track your daily intake',
  },
};

function IconMenu() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconX() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconCart() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 7H19M9 20a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  );
}
function IconGrocery() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

const btn = "flex h-11 w-11 items-center justify-center rounded-full bg-[#1D2D00] text-white shadow-lg ring-1 ring-[#90CD1D]/30 transition-all hover:bg-[#386641] hover:scale-105";

export default function FloatingMenu() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>(null);

  const handlePill = (id: Panel) => {
    setActivePanel(id);
    setMenuOpen(false);
  };
  const closePanel = () => setActivePanel(null);
  const triggerCart = () => (document.getElementById('order-cart-trigger') as HTMLButtonElement | null)?.click();

  return (
    <>
      {/* ── Bottom-right stack ───────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">

        {/* Feature pills — fan up above the stack when menu is open */}
        <AnimatePresence>
          {menuOpen && (
            <div className="absolute bottom-[calc(3*2.75rem+3*0.75rem+0.5rem)] right-0 flex flex-col items-end gap-2.5">
              {featurePills.map((item, i) => (
                <motion.button
                  key={item.id as string}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28, delay: i * 0.05 }}
                  onClick={() => handlePill(item.id)}
                  className="flex items-center gap-2.5 rounded-full border border-[#90CD1D]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#386641] shadow-lg transition-all hover:bg-[#E8F0D7] hover:shadow-xl whitespace-nowrap"
                >
                  <span className="text-[#386641]">{item.icon}</span>
                  {item.label}
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Permanent vertical stack: Grocery → Cart → Menu toggle */}
        <div className="flex flex-col items-center gap-3">
          <button onClick={() => router.push('/grocery')} title="Grocery List" className={btn}>
            <IconGrocery />
          </button>

          <button onClick={triggerCart} title="Cart" className={btn}>
            <IconCart />
          </button>

          <button
            onClick={() => { setMenuOpen(v => !v); if (menuOpen) setActivePanel(null); }}
            className={btn}
            aria-label="Toggle feature menu"
          >
            <motion.span
              animate={{ rotate: menuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              {menuOpen ? <IconX /> : <IconMenu />}
            </motion.span>
          </button>
        </div>
      </div>

      {/* ── Slide-in panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {activePanel && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={closePanel} />
            <motion.aside key="panel" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
              <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#1D2D00] to-[#386641] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-white">{panelMeta[activePanel].icon}</span>
                  <div>
                    <p className="font-bold leading-tight text-white">{panelMeta[activePanel].title}</p>
                    <p className="text-xs text-white/55">{panelMeta[activePanel].sub}</p>
                  </div>
                </div>
                <button onClick={closePanel}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                  <IconX />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activePanel === 'food'    && <FoodSearchPanel />}
                {activePanel === 'health'  && <HealthChatPanel />}
                {activePanel === 'calorie' && <CaloriePanel />}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
