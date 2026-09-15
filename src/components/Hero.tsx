"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "./Button";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative w-full overflow-hidden rounded-2xl">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/videos/Meal.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay — darker at bottom so text pops */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex min-h-[580px] items-end pb-14 sm:min-h-[680px] sm:pb-20"
      >
        <div className="w-full px-6 sm:px-10 lg:px-14">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#90CD1D]/40 bg-[#90CD1D]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4] backdrop-blur-sm">
              🍽️ Premium Nutrition Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-5 max-w-4xl text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Eat Smarter,{" "}
            <span className="bg-gradient-to-r from-[#D6F0A4] to-[#90CD1D] bg-clip-text text-transparent">
              Live Better
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg"
          >
            Personalized nutrition powered by AI. Curated meals, real-time
            calorie tracking, and smart recommendations — all in one place.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button
              className="!bg-[#90CD1D] !text-[#1D2D00] hover:!bg-[#D6F0A4] !px-8 !py-3 text-sm font-bold shadow-lg shadow-[#90CD1D]/30"
              onClick={() => router.push("/all-foods")}
            >
              Browse Meals →
            </Button>
            <Button
              variant="secondary"
              className="!border !border-white/40 !bg-white/10 !text-white backdrop-blur-sm hover:!bg-white/20 !px-8 !py-3 text-sm font-semibold"
              onClick={() => router.push("/user-login")}
            >
              Start Free Trial
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
