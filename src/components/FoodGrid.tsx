"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const foodImages = [
  {
    title: "Fresh Greens Bowl",
    tag: "Vegan",
    calories: "320 kcal",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Protein Packed Plate",
    tag: "High Protein",
    calories: "540 kcal",
    image:
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Colorful Vegan Dish",
    tag: "Plant-Based",
    calories: "280 kcal",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Low-Carb Selection",
    tag: "Keto",
    calories: "410 kcal",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Healthy Breakfast",
    tag: "Balanced",
    calories: "360 kcal",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Seasonal Ingredients",
    tag: "Seasonal",
    calories: "290 kcal",
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80",
  },
];

export default function FoodGrid() {
  const router = useRouter();

  return (
    <section className="bg-white px-6 py-20 sm:px-10 sm:py-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="inline-block rounded-full bg-[#E8F0D7] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#386641]">
          Food Gallery
        </span>
        <h2 className="mt-4 text-4xl font-black text-[#1D2D00] sm:text-5xl">
          Curated for your health
        </h2>
        <p className="mt-4 text-base leading-7 text-[#1D2D00]/60 sm:text-lg">
          A diverse collection of nutritious, delicious meals handpicked for
          optimal health and great taste.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {foodImages.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E8F0D7] bg-[#FAFCF7] shadow-sm transition-all duration-300 hover:shadow-[0_16px_40px_rgba(29,45,0,0.12)]"
            onClick={() => router.push("/all-foods")}
          >
            {/* Image */}
            <div className="relative h-52 w-full overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Tag overlay */}
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#386641] backdrop-blur-sm">
                {item.tag}
              </span>
            </div>

            {/* Card body */}
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="font-bold text-[#1D2D00]">{item.title}</h3>
              <span className="rounded-full bg-[#E8F0D7] px-2.5 py-1 text-xs font-medium text-[#386641]">
                {item.calories}
              </span>
            </div>
          </motion.article>
        ))}
      </div>

      {/* CTA link */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-10 text-center"
      >
        <button
          onClick={() => router.push("/all-foods")}
          className="inline-flex items-center gap-2 rounded-full border border-[#90CD1D] px-7 py-3 text-sm font-semibold text-[#386641] transition-all hover:bg-[#90CD1D] hover:text-[#1D2D00]"
        >
          View all meals →
        </button>
      </motion.div>
    </section>
  );
}
