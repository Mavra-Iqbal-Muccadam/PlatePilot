"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CTA() {
  const router = useRouter();

  return (
    <section className="bg-white px-6 py-20 sm:px-10 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-16 text-center sm:px-14 sm:py-20"
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#D6F0A4]/10 blur-3xl" />

        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]"
        >
          Get Started Today
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.55 }}
          className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl"
        >
          Ready to transform
          <br />
          <span className="bg-gradient-to-r from-[#D6F0A4] to-[#90CD1D] bg-clip-text text-transparent">
            your health?
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.55 }}
          className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg"
        >
          Join thousands of users who've already discovered their perfect meals.
          Start your personalized nutrition journey today — completely free for
          the first week.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <button
            onClick={() => router.push("/user-login")}
            className="w-full rounded-full bg-[#90CD1D] px-10 py-4 text-sm font-bold text-[#1D2D00] shadow-lg shadow-[#90CD1D]/25 transition-all hover:bg-[#D6F0A4] hover:shadow-[#90CD1D]/40 sm:w-auto"
          >
            Start Your Free Trial
          </button>
          <button
            onClick={() => router.push("/browse-deals")}
            className="w-full rounded-full border border-white/25 bg-white/10 px-10 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
          >
            Explore Deals
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-xs text-white/40"
        >
          No credit card required · Access 500K+ meals instantly · Cancel anytime
        </motion.p>
      </motion.div>
    </section>
  );
}
