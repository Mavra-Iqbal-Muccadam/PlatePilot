"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Personalized Meals",
    description:
      "AI-powered recommendations tailored to your nutrition goals, dietary preferences, and lifestyle.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    accent: "#90CD1D",
  },
  {
    title: "Nutrition Tracking",
    description:
      "Understand calories, macros, and meal quality at a glance. Stay on top of your daily intake effortlessly.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    accent: "#6A994E",
  },
  {
    title: "Healthy Lifestyle",
    description:
      "Build sustainable habits with mindful food choices. Discover meals that fuel your body and delight your taste buds.",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    accent: "#386641",
  },
  {
    title: "Smart Deals",
    description:
      "Unlock exclusive restaurant deals and discounts curated just for you. Eat well without breaking the bank.",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    accent: "#90CD1D",
  },
  {
    title: "Allergy Alerts",
    description:
      "Automatic allergen detection keeps you safe. Get instant warnings before ordering anything that could harm you.",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    accent: "#6A994E",
  },
  {
    title: "Diet Plans",
    description:
      "Get AI-generated weekly diet plans aligned with your health goals — whether it's weight loss, muscle gain, or balance.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    accent: "#386641",
  },
];

export default function Features() {
  return (
    <section className="bg-[#F0F4E8] px-6 py-20 sm:px-10 sm:py-28">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="inline-block rounded-full bg-[#D6EAB8] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#386641]">
          Why PlatePilot
        </span>
        <h2 className="mt-4 text-4xl font-black text-[#1D2D00] sm:text-5xl">
          Everything you need to eat well
        </h2>
        <p className="mt-4 text-base leading-7 text-[#1D2D00]/60 sm:text-lg">
          We combine cutting-edge AI with nutritional science to transform how
          you discover, track, and enjoy food.
        </p>
      </motion.div>

      {/* Feature grid */}
      <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl border border-[#C8DFA0]/60 bg-white p-7 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(29,45,0,0.1)]"
          >
            {/* Accent blob */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#90CD1D]/8 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#90CD1D]/15" />

            <div
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${feature.accent}20` }}
            >
              <svg
                className="h-6 w-6"
                style={{ color: feature.accent }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={feature.icon}
                />
              </svg>
            </div>

            <h3 className="relative mt-5 text-lg font-bold text-[#1D2D00]">
              {feature.title}
            </h3>
            <p className="relative mt-2 text-sm leading-6 text-[#1D2D00]/60">
              {feature.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
