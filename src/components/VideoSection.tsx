"use client";

import { motion } from "framer-motion";

const landingVideos = [
  {
    title: "Meal Prep Overview",
    description: "Learn how to prep a week's worth of healthy meals in under an hour.",
    src: "/videos/dp-cep.mp4",
  },
  {
    title: "Healthy Cooking Flow",
    description: "Simple techniques to make nutritious cooking fast and enjoyable.",
    src: "/videos/Meal2.mp4",
  },
  {
    title: "Kitchen Walkthrough",
    description: "A guided tour of the tools and ingredients that make healthy eating easy.",
    src: "/videos/mealwalkthrough.mp4",
  },
];

export default function VideoSection() {
  return (
    <section className="bg-[#EDF3E8] px-6 py-20 sm:px-10 sm:py-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="inline-block rounded-full bg-[#C8DFA0]/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#386641]">
          Learn & Grow
        </span>
        <h2 className="mt-4 text-4xl font-black text-[#1D2D00] sm:text-5xl">
          Watch, learn, and thrive
        </h2>
        <p className="mt-4 text-base leading-7 text-[#1D2D00]/60 sm:text-lg">
          Quick tutorials on meal prep, nutrition science, and building
          sustainable healthy habits.
        </p>
      </motion.div>

      {/* Video grid */}
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-3">
        {landingVideos.map((video, index) => (
          <motion.article
            key={video.src}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className="group overflow-hidden rounded-2xl border border-[#C8DFA0]/60 bg-white shadow-sm transition-all duration-300 hover:shadow-[0_16px_40px_rgba(29,45,0,0.1)]"
          >
            {/* Video */}
            <div className="aspect-video w-full overflow-hidden bg-[#E8F0D7]">
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
              >
                <source src={video.src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Card body */}
            <div className="px-5 py-5">
              <p className="font-bold text-[#1D2D00]">{video.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-[#1D2D00]/60">
                {video.description}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
