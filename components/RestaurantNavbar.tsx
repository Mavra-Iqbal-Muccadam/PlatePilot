'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const navLinks = [
  { href: '/restaurent-dashboard', label: 'Dashboard' },
  { href: '/restaurant-orders',    label: 'Orders'    },
  { href: '/restaurant-menu',      label: 'Menu'      },
  { href: '/add-food',             label: 'Add Item'  },
  { href: '/ai-deal-maker',        label: 'AI Deals'  },
  { href: '/view-deals',           label: 'My Deals'  },
];

export default function RestaurantNavbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    import('../lib/auth/jwt-auth').then(({ ClientAuth }) => {
      ClientAuth.removeToken();
      router.push('/restaurent');
    });
  };

  const getLinkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return `rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-[#90CD1D] text-[#1D2D00]'
        : 'text-[#1D2D00] hover:text-[#90CD1D]'
    }`;
  };

  return (
    <header className="border-b border-[#90CD1D]/15 bg-white shadow-sm">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/restaurent-dashboard"
          className="flex items-center gap-2 text-lg font-bold tracking-wide text-[#1D2D00]">
          <img src="/images/dp-logo.jpeg" alt="PlatePilot" className="h-9 w-9 rounded-full object-cover" />
          <span>
            PlatePilot
            <span className="ml-1.5 rounded-full bg-[#E8F0D7] px-2 py-0.5 text-[10px] font-semibold text-[#386641]">
              Restaurant
            </span>
          </span>
        </Link>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#1D2D00] transition-all hover:bg-[#E8F0D7]/50 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        {/* Desktop nav links */}
        <div className="hidden flex-wrap items-center gap-1 md:ml-6 md:mr-auto md:flex">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className={getLinkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop logout */}
        <div className="hidden items-center md:flex">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-[#C8DFA0] px-3 py-2 text-sm font-medium text-[#386641] transition-all hover:bg-[#E8F0D7]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="border-t border-[#90CD1D]/15 md:hidden"
          >
            <div className="space-y-1 px-4 py-3 sm:px-6">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`block ${getLinkClass(l.href)}`}>
                  {l.label}
                </Link>
              ))}

              <div className="my-2 border-t border-[#90CD1D]/15" />

              <button onClick={handleLogout}
                className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#386641] hover:bg-[#E8F0D7]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                </svg>
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
