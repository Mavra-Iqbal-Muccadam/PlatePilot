"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Areeba Khan",
    role: "Fitness Enthusiast",
    avatar:
      "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=400&q=80",
    text: "PlatePilot helped me find nutritious meals without spending hours planning every day. It's genuinely changed how I eat.",
    rating: 5,
  },
  {
    name: "Hamza Malik",
    role: "Personal Trainer",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    text: "The nutrition details and healthy options made my fitness routine so much easier to maintain. I recommend it to all my clients.",
    rating: 5,
  },
  {
    name: "Sara Iqbal",
    role: "Nutritionist",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    text: "Beautiful interface, smooth flow, and genuinely useful meal recommendations. As a nutritionist, I'm impressed by the accuracy.",
    rating: 5,
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          className={`h-4 w-4 ${index < rating ? "text-[#EAB308]" : "text-[#1D2D00]/15"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-[#F8FAF4] px-6 py-20 sm:px-10 sm:py-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="inline-block rounded-full bg-[#E8F0D7] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#386641]">
          Testimonials
        </span>
        <h2 className="mt-4 text-4xl font-black text-[#1D2D00] sm:text-5xl">
          Loved by health enthusiasts
        </h2>
        <p className="mt-4 text-base leading-7 text-[#1D2D00]/60 sm:text-lg">
          Real stories from real users who've transformed their nutrition and
          lifestyle with PlatePilot.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.article
            key={item.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="flex flex-col rounded-2xl border border-[#E8F0D7] bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(29,45,0,0.1)]"
          >
            {/* Stars */}
            <Stars rating={item.rating} />

            {/* Quote */}
            <p className="mt-4 flex-1 text-sm leading-7 text-[#1D2D00]/80">
              "{item.text}"
            </p>

            {/* Author */}
            <div className="mt-6 flex items-center gap-3 border-t border-[#E8F0D7] pt-5">
              <img
                src={item.avatar}
                alt={item.name}
                loading="lazy"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-[#90CD1D]/30"
              />
              <div>
                <p className="text-sm font-bold text-[#1D2D00]">{item.name}</p>
                <p className="text-xs text-[#1D2D00]/50">{item.role}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Social proof bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mx-auto mt-14 max-w-3xl rounded-2xl border border-[#E8F0D7] bg-white px-8 py-6"
      >
        <div className="flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { value: "50K+", label: "Happy Users" },
            { value: "4.9/5", label: "Average Rating" },
            { value: "98%", label: "Would Recommend" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-black text-[#386641]">{stat.value}</p>
              <p className="mt-0.5 text-xs text-[#1D2D00]/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
