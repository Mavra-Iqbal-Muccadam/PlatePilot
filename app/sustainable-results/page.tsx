'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PDFCommandInvoker, PDFCommandFactory } from '../../lib/commands/pdf-generator-command';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

interface GeneratedDish {
  name: string;
  description: string;
  allergies: string[];
  ingredients: Array<{ ingredient_name: string; calories_count: number; count: number }>;
  recipe: string;
  totalCalories: number;
}

export default function SustainableResults() {
  const router = useRouter();
  const [dish, setDish] = useState<GeneratedDish | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuthAndLoadData = async () => {
      try {
        const { ClientAuth } = await import('../../lib/auth/jwt-auth');
        
        if (!ClientAuth.isAuthenticated()) {
          router.push('/restaurent');
          return;
        }

        // Load generated dish data from localStorage
        const storedDish = localStorage.getItem('generatedDish');
        if (storedDish) {
          setDish(JSON.parse(storedDish));
        } else {
          // If no data, redirect back to sustainable meal page
          router.push('/sustainable-meal');
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

  const formatRecipe = (recipe: string) => {
    // Split recipe into steps if it contains numbered steps
    const steps = recipe.split(/\d+\.|\n/).filter(step => step.trim().length > 0);
    return steps.length > 1 ? steps : [recipe];
  };

  const downloadRecipePDF = async () => {
    if (!dish) return;

    setDownloadingPDF(true);
    try {
      // Use Command Pattern for PDF generation
      const pdfCommand = PDFCommandFactory.createRecipePDFCommand(dish);
      const invoker = new PDFCommandInvoker();
      invoker.setCommand(pdfCommand);
      await invoker.executeCommand();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#90CD1D] border-b-[#1D2D00]"></div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF4]">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-[#386641]">No Recipe Found</h2>
          <button
            onClick={() => router.push('/sustainable-meal')}
            className="rounded-xl border border-[#90CD1D]/35 bg-[#386641] px-6 py-3 text-white transition-all hover:bg-[#6A994E]"
          >
            Generate New Recipe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAF4] text-[#386641]`}>
      <header className="border-b border-[#90CD1D]/30 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A994E]">Sustainable Kitchen</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1D2D00]">
                AI Generated Recipe
              </h1>
              <p className="mt-1 text-sm text-[#6A994E]">Sustainable dish created from your selected ingredients.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/sustainable-meal')}
                className="rounded-xl border border-[#90CD1D]/35 bg-white px-5 py-2.5 text-sm font-semibold text-[#386641] transition-all hover:bg-[#F8FAF4]"
              >
                Back to Ingredients
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-[#1D2D00] sm:text-4xl">{dish.name}</h2>
            <p className="mx-auto max-w-3xl text-center text-base leading-relaxed text-[#6A994E]">
              {dish.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#90CD1D]/50 bg-[#F8FAF4]/60 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#90CD1D]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1D2D00]">{dish.ingredients.length}</h3>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6A994E]">Ingredients Used</p>
            </div>

            <div className="rounded-2xl border border-[#90CD1D]/50 bg-[#F8FAF4]/60 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#386641]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1D2D00]">{dish.totalCalories}</h3>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6A994E]">Total Calories</p>
            </div>

            <div className="rounded-2xl border border-[#90CD1D]/50 bg-[#F8FAF4]/60 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6A994E]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1D2D00]">{dish.allergies.length}</h3>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6A994E]">Potential Allergens</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#90CD1D]/30 bg-white p-8 shadow-[0_16px_30px_rgba(144,205,29,0.13)]">
            <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-[#1D2D00]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#90CD1D]">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              Ingredients Used
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {dish.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-[#90CD1D]/30 bg-[#F8FAF4] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#90CD1D]">
                      <span className="text-white font-bold text-sm">
                        {ingredient.ingredient_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1D2D00]">{ingredient.ingredient_name}</h4>
                      <p className="text-sm text-[#6A994E]">Quantity: {ingredient.count}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1D2D00]">{ingredient.calories_count * ingredient.count} cal</p>
                    <p className="text-sm text-[#6A994E]">{ingredient.calories_count} cal each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-[#90CD1D]/30 bg-white p-8 shadow-[0_16px_30px_rgba(144,205,29,0.13)]">
            <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-[#1D2D00]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6A994E]">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              Potential Allergens
            </h3>
            {dish.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {dish.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-[#90CD1D]/40 bg-[#90CD1D]/10 px-4 py-2 text-sm font-semibold text-[#6A994E]"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="italic text-[#6A994E]">No known allergens identified</p>
            )}
            </div>

            <div className="rounded-2xl border border-[#90CD1D]/30 bg-gradient-to-br from-[#F8FAF4] to-white p-6 shadow-[0_12px_26px_rgba(144,205,29,0.1)]">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6A994E]">Actions</h4>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => router.push('/sustainable-meal')}
                  className="w-full rounded-xl border border-[#90CD1D]/35 bg-white px-5 py-3 text-sm font-semibold text-[#386641] transition-all hover:bg-[#F8FAF4]"
                >
                  Generate Another Recipe
                </button>
                <button
                  onClick={() => {
                    const recipeData = {
                      dishName: dish.name,
                      description: dish.description,
                      ingredients: dish.ingredients.map(ing => ({
                        name: ing.ingredient_name,
                        calories: ing.calories_count * ing.count
                      })),
                      allergies: dish.allergies,
                      totalCalories: dish.totalCalories
                    };
                    localStorage.setItem('recipeDataForMenu', JSON.stringify(recipeData));
                    router.push('/add-food');
                  }}
                  className="w-full rounded-xl border border-[#90CD1D]/45 bg-[#386641] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(56,102,65,0.22)] transition-all hover:bg-[#6A994E]"
                >
                  Add to Menu
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#90CD1D]/30 bg-white p-8 shadow-[0_16px_30px_rgba(144,205,29,0.13)]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-3 text-xl font-bold text-[#1D2D00]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#386641]">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              Cooking Instructions
            </h3>
            <button
              onClick={downloadRecipePDF}
              disabled={downloadingPDF}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                downloadingPDF
                  ? 'cursor-not-allowed bg-gray-500 text-white opacity-70'
                  : 'border border-[#90CD1D]/45 bg-[#386641] text-white shadow-[0_10px_24px_rgba(56,102,65,0.3)] hover:bg-[#6A994E]'
              }`}
            >
              {downloadingPDF ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
          <div className="space-y-3">
            {formatRecipe(dish.recipe).map((step, index) => (
              <div key={index} className="rounded-xl border border-[#90CD1D]/30 bg-[#F8FAF4] p-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#386641]">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="leading-relaxed text-[#1D2D00]">{step.trim()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}