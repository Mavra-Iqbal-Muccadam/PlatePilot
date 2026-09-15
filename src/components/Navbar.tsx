"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const baseLeftLinks = [
  { href: "/", label: "Home" },
  { href: "/browse-restaurants", label: "Restaurants" },
  { href: "/browse-deals", label: "Deals" },
  { href: "/all-foods", label: "Menu" },
  { href: "/my-orders", label: "Cart" },
];

const guestRightLinks = [
  { href: "/user-login", label: "Login" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const checkUserAuth = () => {
      const hasUserToken = !!localStorage.getItem("userToken");
      const hasUserData = !!localStorage.getItem("userData");
      setIsUserLoggedIn(hasUserToken || hasUserData);
    };

    checkUserAuth();
    window.addEventListener("storage", checkUserAuth);
    return () => window.removeEventListener("storage", checkUserAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    // Trigger storage event so other tabs/components update
    window.dispatchEvent(new Event("storage"));
    setIsUserLoggedIn(false);
    setMenuOpen(false);
    router.push("/");
  };

  const leftLinks = useMemo(() => {
    if (isUserLoggedIn) {
      return [...baseLeftLinks, { href: "/user-dashboard", label: "Profile" }];
    }
    return baseLeftLinks;
  }, [isUserLoggedIn]);

  const getLinkClass = (href: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return `rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-[#90CD1D] text-[#1D2D00]"
        : "text-[#1D2D00] hover:text-[#90CD1D]"
    }`;
  };

  return (
    <header className="border-b border-[#90CD1D]/15 bg-white shadow-sm">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-wide text-[#1D2D00]">
          <img src="/images/dp-logo.jpeg" alt="PlatePilot logo" className="h-9 w-9 rounded-full object-cover" />
          <span>PlatePilot</span>
        </Link>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(prev => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#1D2D00] transition-all hover:bg-[#E8F0D7]/50 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {/* Desktop left links */}
        <div className="hidden flex-wrap items-center gap-1 md:ml-6 md:mr-auto md:flex">
          {leftLinks.map(item => (
            <Link key={item.href + item.label} href={item.href} className={getLinkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop right — logout or login/signup */}
        <div className="hidden items-center gap-2 md:flex">
          {isUserLoggedIn ? (
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
          ) : (
            guestRightLinks.map(item => (
              <Link key={item.label} href={item.href} className={getLinkClass(item.href)}>
                {item.label}
              </Link>
            ))
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="border-t border-[#90CD1D]/15 md:hidden"
          >
            <div className="space-y-1 px-4 py-3 sm:px-6">
              {leftLinks.map(item => (
                <Link key={item.href + item.label} href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block ${getLinkClass(item.href)}`}>
                  {item.label}
                </Link>
              ))}

              <div className="my-2 border-t border-[#90CD1D]/15" />

              {isUserLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#386641] hover:bg-[#E8F0D7]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                  </svg>
                  Logout
                </button>
              ) : (
                guestRightLinks.map(item => (
                  <Link key={item.label} href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block ${getLinkClass(item.href)}`}>
                    {item.label}
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
