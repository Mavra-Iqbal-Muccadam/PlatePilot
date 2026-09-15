'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

interface HealthyIngredient {
  original: string;
  healthy: string;
  reason: string;
  calories: number;
}

interface HealthyDish {
  name: string;
  description: string;
  healthyIngredients: HealthyIngredient[];
  recipe: string;
  allergies: string[];
  healthBenefits: string[];
  calorieReduction: number;
}

interface OriginalFood {
  id: number;
  name: string;
  description?: string;
  price: number;
  ingredients: Array<{ ingredient_name: string; calories_count: number }>;
}

interface HealthyDishResult {
  originalFood: OriginalFood;
  healthyVersion: HealthyDish;
}

export default function MakeHealthyResults() {
  const router = useRouter();
  const [result, setResult] = useState<HealthyDishResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuthAndLoadData = async () => {
      try {
        const { ClientAuth } = await import('../../lib/auth/jwt-auth');
        
        if (!ClientAuth.isAuthenticated()) {
          router.push('/restaurent');
          return;
        }

        // Load healthy dish result from localStorage
        const storedResult = localStorage.getItem('healthyDishResult');
        if (storedResult) {
          setResult(JSON.parse(storedResult));
        } else {
          // If no data, redirect back to make-healthy page
          router.push('/make-healthy');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/restaurent');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#90CD1D] border-b-[#1D2D00]"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-[#386641]">No Results Found</h2>
          <button
            onClick={() => router.push('/make-healthy')}
            className="rounded-xl border border-[#90CD1D]/35 bg-[#386641] px-6 py-3 text-white transition-all hover:bg-[#6A994E]"
          >
            Back to Make Healthy
          </button>
        </div>
      </div>
    );
  }

  const { originalFood, healthyVersion } = result;

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAF4] text-[#386641]`}>
      <header className="border-b border-[#90CD1D]/30 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A994E]">Healthy Lab</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1D2D00]">
                Healthy Transformation Results
              </h1>
              <p className="mt-1 text-sm text-[#6A994E]">Your dish has been transformed into a healthier version.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/make-healthy')}
                className="rounded-xl border border-[#90CD1D]/35 bg-white px-5 py-2.5 text-sm font-semibold text-[#386641] transition-all hover:bg-[#F8FAF4]"
              >
                Back to Make Healthy
              </button>
              <button
                onClick={() => router.push('/restaurent-dashboard')}
                className="rounded-xl border border-[#90CD1D]/45 bg-[#386641] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(56,102,65,0.25)] transition-all hover:bg-[#6A994E]"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[24px] border border-[#90CD1D]/30 bg-white shadow-[0_20px_38px_rgba(144,205,29,0.13)]">
          <div className="relative border-b border-[#90CD1D]/45 bg-gradient-to-br from-[#F8FAF4] to-[#F8FAF4] p-8">
            <div className="absolute -right-8 -top-6 h-28 w-28 rounded-full bg-[#90CD1D]/15 blur-2xl" />
            <div className="absolute -bottom-10 left-1/3 h-20 w-20 rounded-full bg-[#6A994E]/12 blur-xl" />

            <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#90CD1D] to-[#6A994E]">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-[#1D2D00] sm:text-4xl">{healthyVersion.name}</h2>
            <p className="mx-auto max-w-3xl text-center text-base leading-relaxed text-[#6A994E]">
              {healthyVersion.description}
            </p>
            <p className="mt-3 text-center text-sm text-[#6A994E]">
              Original dish: <span className="font-semibold text-[#1D2D00]">{originalFood.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#90CD1D]/50 bg-[#F8FAF4]/60 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#386641]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1D2D00]">{healthyVersion.calorieReduction}%</h3>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6A994E]">Calorie Reduction</p>
            </div>

            <div className="rounded-2xl border border-[#90CD1D]/50 bg-[#F8FAF4]/60 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#90CD1D]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1D2D00]">{healthyVersion.healthyIngredients.length}</h3>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6A994E]">Healthy Substitutions</p>
            </div>

            <div className="rounded-2xl border border-[#90CD1D]/50 bg-[#F8FAF4]/60 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6A994E]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1D2D00]">{healthyVersion.healthBenefits.length}</h3>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6A994E]">Health Benefits</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#90CD1D]/30 bg-white p-8 shadow-[0_16px_30px_rgba(144,205,29,0.1)]">
            <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-[#1D2D00]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#386641]">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Healthy Substitutions
            </h3>
            <div className="space-y-4">
              {healthyVersion.healthyIngredients.map((ingredient, index) => (
                <div key={index} className="rounded-lg border border-[#90CD1D]/45 bg-[#F8FAF4]/50 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium text-[#E74C3C] line-through">{ingredient.original}</span>
                        <span className="text-[#6A994E]/70">→</span>
                        <span className="font-semibold text-[#1D2D00]">{ingredient.healthy}</span>
                      </div>
                      <p className="mb-2 text-sm text-[#6A994E]">{ingredient.reason}</p>
                    </div>
                    <div className="ml-4 rounded-lg border border-[#90CD1D]/50 bg-white px-3 py-2 text-right">
                      <p className="font-semibold text-[#1D2D00]">{ingredient.calories} cal</p>
                      <p className="text-xs text-[#6A994E]">per serving</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-[#90CD1D]/30 bg-white p-8 shadow-[0_16px_30px_rgba(144,205,29,0.1)]">
            <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-[#1D2D00]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6A994E]">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              Health Benefits
            </h3>
            <div className="space-y-3">
              {healthyVersion.healthBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border border-[#90CD1D]/45 bg-[#F8FAF4]/50 p-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#6A994E]">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-[#1D2D00]">{benefit}</p>
                </div>
              ))}
            </div>

            {healthyVersion.allergies.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-3 font-semibold text-[#1D2D00]">Potential Allergens:</h4>
                <div className="flex flex-wrap gap-2">
                  {healthyVersion.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-[#E74C3C]/40 bg-[#E74C3C]/10 px-3 py-1 text-sm font-medium text-[#E74C3C]"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
            </div>

            <div className="rounded-2xl border border-[#90CD1D]/30 bg-gradient-to-br from-[#F8FAF4] to-[#F8FAF4] p-6 shadow-[0_12px_26px_rgba(144,205,29,0.1)]">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6A994E]">Actions</h4>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => router.push('/make-healthy')}
                  className="w-full rounded-xl border border-[#90CD1D]/35 bg-white px-5 py-3 text-sm font-semibold text-[#386641] transition-all hover:bg-[#F8FAF4]"
                >
                  Transform Another Dish
                </button>
                <button
                  onClick={() => {
                    const { MenuCommandFactory, MenuCommandInvoker } = require('../../lib/commands/healthy-menu-command');

                    const command = MenuCommandFactory.createHealthyMenuTransferCommand(
                      healthyVersion.name,
                      healthyVersion.description,
                      healthyVersion.healthyIngredients,
                      healthyVersion.allergies
                    );

                    const invoker = new MenuCommandInvoker();
                    invoker.setCommand(command);
                    invoker.executeCommand();

                    router.push('/add-food');
                  }}
                  className="w-full rounded-xl border border-[#90CD1D]/45 bg-[#386641] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(56,102,65,0.22)] transition-all hover:bg-[#6A994E]"
                >
                  Add Healthy Version to Menu
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#90CD1D]/30 bg-white p-8 shadow-[0_16px_30px_rgba(144,205,29,0.1)]">
          <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-[#1D2D00]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#90CD1D]">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            Healthy Recipe Instructions
          </h3>
          <div className="rounded-xl border border-[#90CD1D]/45 bg-[#F8FAF4]/50 p-6">
            <p className="whitespace-pre-line leading-relaxed text-[#1D2D00]">{healthyVersion.recipe}</p>
          </div>
        </div>
      </main>
    </div>
  );
}