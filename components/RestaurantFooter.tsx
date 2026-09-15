'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaInstagram, FaFacebookF, FaXTwitter } from 'react-icons/fa6';

// Hide on the restaurant login page
const HIDDEN_ON = ['/restaurent'];

const links = [
  { label: 'Dashboard',  href: '/restaurent-dashboard' },
  { label: 'Orders',     href: '/restaurant-orders'    },
  { label: 'Menu',       href: '/restaurant-menu'      },
  { label: 'Add Item',   href: '/add-food'             },
  { label: 'AI Deals',   href: '/ai-deal-maker'        },
  { label: 'My Deals',   href: '/view-deals'           },
];

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', icon: FaInstagram },
  { label: 'Facebook',  href: 'https://facebook.com',  icon: FaFacebookF },
  { label: 'Twitter',   href: 'https://x.com',         icon: FaXTwitter  },
];

export default function RestaurantFooter() {
  const pathname = usePathname();
  if (HIDDEN_ON.some(p => pathname === p || pathname.startsWith(p + '/'))) return null;

  return (
    <footer className="border-t border-[#F4B7A0]/40 bg-[#7A2E2E] text-[#FFF8F1]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/images/dp-logo.jpeg" alt="PlatePilot" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#F4B7A0]/40" />
              <span className="text-lg font-bold">PlatePilot</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#F4B7A0]">Restaurant Portal</p>
            <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[#FFF8F1]/60">
              Manage your menu, publish deals, and track orders — all in one place.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#F4B7A0]">Quick Links</h4>
            <ul className="space-y-2">
              {links.map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-[#FFF8F1]/70 transition-colors hover:text-[#F4B7A0]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#F4B7A0]">Support</h4>
            <ul className="space-y-2 text-sm text-[#FFF8F1]/70">
              <li><a href="#" className="transition-colors hover:text-[#F4B7A0]">Help Center</a></li>
              <li><a href="#" className="transition-colors hover:text-[#F4B7A0]">Privacy Policy</a></li>
              <li><a href="#" className="transition-colors hover:text-[#F4B7A0]">Terms of Service</a></li>
              <li><Link href="/user-login" className="transition-colors hover:text-[#F4B7A0]">Switch to User</Link></li>
            </ul>
          </div>

          {/* Contact & social */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#F4B7A0]">Contact</h4>
            <p className="text-sm text-[#FFF8F1]/70">restaurants@platepilot.app</p>
            <div className="mt-3 flex gap-2">
              {socialLinks.map(s => {
                const Icon = s.icon;
                return (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F4B7A0]/25 text-[#FFF8F1]/70 transition-all hover:border-[#F4B7A0] hover:bg-[#BC4749] hover:text-white">
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#F4B7A0]/15">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-[#FFF8F1]/40">
            © 2026 PlatePilot Restaurant Portal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
