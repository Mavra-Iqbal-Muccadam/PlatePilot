"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaInstagram, FaFacebookF, FaXTwitter } from "react-icons/fa6";
import styles from "./Footer.module.css";

const HIDDEN_ON = [
  "/user-login",
  "/restaurent",
  "/browse-restaurants",
  "/restaurent-dashboard",
  "/restaurant-orders",
  "/restaurant-menu",
  "/add-food",
  "/ai-deal-maker",
  "/view-deals",
];

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/all-foods" },
  { label: "About", href: "/user-dashboard" },
  { label: "Contact", href: "/user-login" },
];

const resourceLinks = [
  { label: "Blog", href: "/" },
  { label: "FAQs", href: "/" },
  { label: "Privacy Policy", href: "/" },
  { label: "Terms of Service", href: "/" },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com", icon: FaInstagram },
  { label: "Facebook", href: "https://facebook.com", icon: FaFacebookF },
  { label: "Twitter", href: "https://x.com", icon: FaXTwitter },
];

export default function Footer() {
  const pathname = usePathname();
  if (HIDDEN_ON.some(p => pathname === p || pathname.startsWith(p + "/"))) return null;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <section>
            <div className="flex items-center gap-3">
              <img
                src="/images/dp-logo.jpeg"
                alt="PlatePilot logo"
                className="h-10 w-10 rounded-full border border-[#90CD1D]/40 object-cover"
              />
              <h3 className={styles.brand}>PlatePilot</h3>
            </div>
            <p className={styles.tagline}>Eat Smart, Live Better</p>
            <p className={styles.description}>
              PlatePilot helps you discover healthier meals, mindful nutrition
              choices, and better daily food habits.
            </p>
          </section>

          <section>
            <h4 className={styles.heading}>Quick Links</h4>
            <ul className={styles.list}>
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className={styles.heading}>Resources</h4>
            <ul className={styles.list}>
              {resourceLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className={styles.heading}>Contact & Social</h4>
            <p className={styles.contact}>hello@platepilot.app</p>
            <div className={styles.socials}>
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className={styles.socialLink}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
            <form
              className={styles.newsletter}
              onSubmit={(event) => event.preventDefault()}
            >
              <label
                htmlFor="newsletter-email"
                className={styles.newsletterLabel}
              >
                Newsletter
              </label>
              <div className={styles.newsletterControls}>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Your email"
                  className={styles.input}
                />
                <button type="submit" className={styles.subscribeButton}>
                  Subscribe
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <p className={styles.copyright}>
            © 2026 PlatePilot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
