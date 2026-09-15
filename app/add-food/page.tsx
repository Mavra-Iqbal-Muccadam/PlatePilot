'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantNavbar from '../../components/RestaurantNavbar';

interface Ingredient { id: string; name: string; calories: number; }
interface Allergy    { id: string; name: string; }

export default function AddFood() {
  const router = useRouter();
  const [dishName, setDishName]         = useState('');
  const [description, setDescription]   = useState('');
  const [ingredients, setIngredients]   = useState<Ingredient[]>([]);
  const [allergies, setAllergies]       = useState<Allergy[]>([]);
  const [newIngredient, setNewIngredient] = useState({ name: '', calories: '' });
  const [newAllergy, setNewAllergy]     = useState('');
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [price, setPrice]               = useState('');
  const [totalCalories, setTotalCalories] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [toast, setToast]               = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setTotalCalories(ingredients.reduce((s, i) => s + i.calories, 0));
  }, [ingredients]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Autofill from sustainable-results page
  useEffect(() => {
    const raw = localStorage.getItem('recipeDataForMenu');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setDishName(data.dishName || '');
      setDescription(data.description || '');
      if (data.ingredients?.length) {
        setIngredients(data.ingredients.map((i: any, idx: number) => ({ id: `r-${idx}`, name: i.name, calories: i.calories })));
      }
      if (data.allergies?.length) {
        setAllergies(data.allergies.map((a: string, idx: number) => ({ id: `ra-${idx}`, name: a })));
      }
      localStorage.removeItem('recipeDataForMenu');
    } catch { /* ignore */ }
  }, []);

  const addIngredient = () => {
    if (!newIngredient.name.trim() || !newIngredient.calories) return;
    setIngredients(prev => [...prev, { id: Date.now().toString(), name: newIngredient.name.trim(), calories: parseInt(newIngredient.calories) }]);
    setNewIngredient({ name: '', calories: '' });
  };

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    setAllergies(prev => [...prev, { id: Date.now().toString(), name: newAllergy.trim() }]);
    setNewAllergy('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generateWithAI = async () => {
    if (!dishName.trim()) { setToast({ type: 'error', text: 'Enter a dish name first' }); return; }
    setIsGenerating(true);
    try {
      setGenerationStep('Generating ingredients…');
      const ingRes = await fetch('/api/generate-dish-data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName, type: 'ingredients' }),
      });
      if (ingRes.ok) {
        const d = await ingRes.json();
        if (d.ingredients?.length) {
          setIngredients(d.ingredients.map((i: any, idx: number) => ({ id: `ai-${idx}`, name: i.name, calories: i.calories })));
        }
      }

      setGenerationStep('Generating allergens…');
      const algRes = await fetch('/api/generate-dish-data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName, type: 'allergies' }),
      });
      if (algRes.ok) {
        const d = await algRes.json();
        if (d.allergies?.length) {
          setAllergies(d.allergies.map((a: string, idx: number) => ({ id: `ai-a-${idx}`, name: a })));
        }
      }

      setGenerationStep('Done!');
      setTimeout(() => setGenerationStep(''), 1500);
    } catch { setToast({ type: 'error', text: 'AI generation failed' }); }
    finally { setIsGenerating(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) { setToast({ type: 'error', text: 'Enter a dish name' }); return; }
    if (!price || parseFloat(price) <= 0) { setToast({ type: 'error', text: 'Enter a valid price' }); return; }
    if (ingredients.length === 0) { setToast({ type: 'error', text: 'Add at least one ingredient' }); return; }

    setSubmitting(true);
    try {
      const { ClientAuth } = await import('../../lib/auth/jwt-auth');
      if (!ClientAuth.isAuthenticated()) { router.push('/restaurent'); return; }

      const convertToBase64 = (file: File): Promise<string> =>
        new Promise((res, rej) => { const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result as string); r.onerror = rej; });

      const res = await fetch('/api/create-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ClientAuth.getAuthHeaders() },
        body: JSON.stringify({
          dishName: dishName.trim(),
          description: description.trim(),
          price: parseFloat(price),
          allergies: allergies.map(a => a.name),
          ingredients: ingredients.map(i => ({ name: i.name, calories: i.calories })),
          imageFile: imageFile ? await convertToBase64(imageFile) : null,
          imageFileName: imageFile?.name,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ type: 'success', text: 'Menu item added!' });
        setTimeout(() => router.push('/restaurant-menu'), 1000);
      } else {
        setToast({ type: 'error', text: result.error || 'Failed to add item' });
      }
    } catch { setToast({ type: 'error', text: 'Network error' }); }
    finally { setSubmitting(false); }
  };

  const inputClass = 'w-full rounded-xl border border-[#C8DFA0] bg-white px-4 py-3 text-sm text-[#1D2D00] placeholder:text-[#1D2D00]/40 outline-none transition-all focus:border-[#90CD1D] focus:ring-2 focus:ring-[#90CD1D]/20';
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#386641]';
  const cardClass  = 'rounded-2xl border border-[#E8F0D7] bg-white p-6 shadow-sm';

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <RestaurantNavbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed left-1/2 top-5 z-[2000] -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl ${
          toast.type === 'success' ? 'border-[#90CD1D]/40 bg-[#1D2D00] text-[#D6F0A4]' : 'border-red-300 bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-10 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                Menu Control
              </span>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Add Menu Item</h1>
              <p className="mt-1 text-sm text-white/50">Build a polished listing with AI-assisted metadata.</p>
            </div>
            <button onClick={() => router.push('/restaurant-menu')}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
              ← Back to Menu
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">

            {/* Basics */}
            <div className={cardClass}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#1D2D00]">Dish Basics</h2>
                  <p className="text-xs text-[#1D2D00]/50">Name, description, and AI generation.</p>
                </div>
                <button type="button" onClick={generateWithAI}
                  disabled={isGenerating || !dishName.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#1D2D00] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#386641] disabled:opacity-40">
                  {isGenerating
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{generationStep || 'Generating…'}</>
                    : <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>AI Generate</>}
                </button>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className={labelClass}>Dish Name *</span>
                  <input type="text" value={dishName} onChange={e => setDishName(e.target.value)}
                    placeholder="e.g. Grilled Salmon Bowl" className={inputClass} required />
                </label>
                <label className="block">
                  <span className={labelClass}>Description</span>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={3} placeholder="Short menu-ready description…"
                    className={`${inputClass} resize-none`} />
                </label>
              </div>
            </div>

            {/* Ingredients */}
            <div className={cardClass}>
              <h2 className="mb-1 text-lg font-bold text-[#1D2D00]">Ingredients</h2>
              <p className="mb-5 text-xs text-[#1D2D00]/50">Add ingredients with calories per serving.</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <label className="block">
                  <span className={labelClass}>Name</span>
                  <input type="text" value={newIngredient.name}
                    onChange={e => setNewIngredient(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Chicken breast" className={inputClass}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredient())} />
                </label>
                <label className="block">
                  <span className={labelClass}>Calories</span>
                  <input type="number" value={newIngredient.calories}
                    onChange={e => setNewIngredient(p => ({ ...p, calories: e.target.value }))}
                    placeholder="165" min="0" className={inputClass}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredient())} />
                </label>
                <button type="button" onClick={addIngredient}
                  className="self-end rounded-xl bg-[#1D2D00] px-5 py-3 text-sm font-bold text-white hover:bg-[#386641]">
                  Add
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {ingredients.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#C8DFA0] p-5 text-center text-sm text-[#1D2D00]/40">
                    No ingredients yet
                  </div>
                ) : ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1D2D00]">{ing.name}</p>
                      <p className="text-xs text-[#1D2D00]/50">{ing.calories} kcal</p>
                    </div>
                    <button type="button" onClick={() => setIngredients(p => p.filter(i => i.id !== ing.id))}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div className={cardClass}>
              <h2 className="mb-1 text-lg font-bold text-[#1D2D00]">Allergens</h2>
              <p className="mb-5 text-xs text-[#1D2D00]/50">Tag common allergen information for customers.</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className={labelClass}>Allergen</span>
                  <input type="text" value={newAllergy} onChange={e => setNewAllergy(e.target.value)}
                    placeholder="e.g. Nuts, Gluten, Dairy" className={inputClass}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())} />
                </label>
                <button type="button" onClick={addAllergy}
                  className="self-end rounded-xl bg-[#1D2D00] px-5 py-3 text-sm font-bold text-white hover:bg-[#386641]">
                  Add
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {allergies.length === 0 ? (
                  <p className="text-sm text-[#1D2D00]/40">No allergens added</p>
                ) : allergies.map(a => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                    {a.name}
                    <button type="button" onClick={() => setAllergies(p => p.filter(x => x.id !== a.id))}
                      className="leading-none hover:text-red-800">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Media & Pricing */}
            <div className={cardClass}>
              <h2 className="mb-5 text-lg font-bold text-[#1D2D00]">Media & Pricing</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Price (PKR) *</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#386641]">PKR</span>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                      placeholder="0" min="0" step="1" required
                      className={`${inputClass} pl-14`} />
                  </div>
                </label>
              </div>
              {imagePreview && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-[#E8F0D7]">
                  <img src={imagePreview} alt="Preview" className="h-56 w-full object-cover" />
                  <div className="flex items-center justify-between border-t border-[#E8F0D7] px-4 py-2">
                    <span className="text-xs text-[#1D2D00]/50">Image preview</span>
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="text-xs font-semibold text-red-500 hover:text-red-700">Remove</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
            {/* Live summary */}
            <div className={cardClass}>
              <h3 className="mb-4 text-sm font-bold text-[#1D2D00]"> Summary</h3>
              <div className="space-y-2">
                {[
                  { label: 'Ingredients',    value: ingredients.length },
                  { label: 'Allergens',      value: allergies.length },
                  { label: 'Total Calories', value: `${totalCalories} kcal` },
                  { label: 'Price',          value: price ? `PKR ${parseFloat(price).toFixed(0)}` : '—' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] px-4 py-2.5">
                    <span className="text-sm text-[#1D2D00]/60">{s.label}</span>
                    <span className="text-sm font-bold text-[#1D2D00]">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting || isGenerating}
              className="w-full rounded-2xl bg-[#1D2D00] py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#386641] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting
                ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving…</span>
                : 'Add Menu Item'}
            </button>

            <p className="text-center text-xs text-[#1D2D00]/40">
              Item will be visible to customers immediately after saving.
            </p>
          </aside>
        </form>
      </main>
    </div>
  );
}
