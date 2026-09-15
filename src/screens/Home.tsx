"use client";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import FoodGrid from "../components/FoodGrid";
import VideoSection from "../components/VideoSection";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      <main className="w-full">
        <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <Hero />
        </div>
        <Features />
        <FoodGrid />
        <VideoSection />
        <Testimonials />
        <CTA />
      </main>
    </div>
  );
}
