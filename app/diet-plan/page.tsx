'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../src/components/Navbar';

interface UserProfile {
  age?: number;
  weight?: number;
  profession?: string;
  allergies?: string[];
  currentCalories?: number;
  dailyLimit?: number;
}

// Parse the AI-generated markdown into structured sections
function parseDietPlan(text: string) {
  const lines = text.split('\n');
  const sections: Array<{ type: string; content: string; level?: number }> = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { sections.push({ type: 'spacer', content: '' }); continue; }

    const imageMatch = line.match(/https?:\/\/[^\s]+/);
    if (imageMatch && line.toLowerCase().includes('image')) {
      sections.push({ type: 'image', content: imageMatch[0] }); continue;
    }
    if (line.startsWith('### ')) { sections.push({ type: 'h3', content: line.replace(/^###\s*/, '') }); continue; }
    if (line.startsWith('## '))  { sections.push({ type: 'h2', content: line.replace(/^##\s*/, '') }); continue; }
    if (line.startsWith('# '))   { sections.push({ type: 'h1', content: line.replace(/^#\s*/, '') }); continue; }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      sections.push({ type: 'bullet', content: line.replace(/^[-*]\s*/, '') }); continue;
    }
    if (/^\d+\.\s/.test(line)) {
      sections.push({ type: 'numbered', content: line.replace(/^\d+\.\s*/, '') }); continue;
    }
    sections.push({ type: 'text', content: line });
  }
  return sections;
}

function renderBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-[#1D2D00]">{p}</strong> : p);
}

export default function DietPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dietPlan, setDietPlan] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try { setUserId(JSON.parse(userData).id); }
      catch { setError('Failed to load user data'); setLoading(false); }
    } else {
      setError('Please log in to view diet plans');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [profileRes, allergiesRes, caloriesRes] = await Promise.all([
          fetch(`/api/user-profile?userId=${userId}`),
          fetch(`/api/user-allergies?userId=${userId}`),
          fetch(`/api/user-calory?userId=${userId}`),
        ]);
        const [profileData, allergiesData, caloriesData] = await Promise.all([
          profileRes.json(), allergiesRes.json(), caloriesRes.json(),
        ]);

        if (profileData.success && caloriesData.success) {
          const profile: UserProfile = {
            age: profileData.user?.age,
            weight: profileData.user?.weight,
            profession: profileData.user?.profession,
            allergies: allergiesData.allergies || [],
            currentCalories: caloriesData.data?.current_calory || 0,
            dailyLimit: caloriesData.data?.limit_calory || 2000,
          };
          setUserProfile(profile);
          await generateDietPlan(profile);
        } else {
          setError('Failed to load user data');
        }
      } catch { setError('Error loading user data'); }
      finally { setLoading(false); }
    };
    fetchUserData();
  }, [userId]);

  const generateDietPlan = async (profile: UserProfile) => {
    try {
      setGenerating(true);
      const res = await fetch('/api/generate-diet-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, age: profile.age, weight: profile.weight, allergies: profile.allergies, profession: profile.profession, currentCalories: profile.currentCalories, dailyLimit: profile.dailyLimit }),
      });
      const data = await res.json();
      if (data.success) { setDietPlan(data.dietPlan); setError(null); }
      else setError(data.error || 'Failed to generate diet plan');
    } catch { setError('Error generating diet plan'); }
    finally { setGenerating(false); }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F8FAF4]">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="h-12 w-12 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
        <p className="text-sm text-[#1D2D00]/50">Loading your diet plan…</p>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && !dietPlan) return (
    <div className="min-h-screen bg-[#F8FAF4]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
          <h2 className="text-lg font-bold text-red-700">{error}</h2>
          <button onClick={() => router.push('/user-dashboard')}
            className="mt-5 rounded-xl bg-[#1D2D00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#386641]">
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );

  const sections = parseDietPlan(dietPlan);
  const calPct = userProfile ? Math.min(100, Math.round(((userProfile.currentCalories || 0) / (userProfile.dailyLimit || 2000)) * 100)) : 0;
  const calColor = calPct >= 100 ? '#EF4444' : calPct >= 80 ? '#F97316' : calPct >= 60 ? '#EAB308' : '#22C55E';

  return (
    <div className="min-h-screen bg-[#F8FAF4] text-[#1D2D00]">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] px-8 py-12 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#D6F0A4]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full border border-[#90CD1D]/30 bg-[#90CD1D]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D6F0A4]">
                AI-Powered
              </span>
              <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">Your Diet Plan</h1>
              <p className="mt-2 text-sm text-white/60">Personalised to your health goals, allergies, and lifestyle.</p>
            </div>
            <button onClick={() => router.push('/user-dashboard')}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
              ← Dashboard
            </button>
          </div>
        </div>

        {/* ── Profile summary ───────────────────────────────────────────── */}
        {userProfile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="mb-8 rounded-2xl border border-[#E8F0D7] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1D2D00]/50">Your Profile</h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Age',        value: userProfile.age ? `${userProfile.age} yrs` : '—' },
                { label: 'Weight',     value: userProfile.weight ? `${userProfile.weight} kg` : '—' },
                { label: 'Profession', value: userProfile.profession || '—' },
                { label: 'Cal Limit',  value: `${userProfile.dailyLimit?.toLocaleString()} kcal` },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-[#E8F0D7] bg-[#F8FAF4] p-3">
                  <p className="text-xs text-[#1D2D00]/50">{s.label}</p>
                  <p className="mt-0.5 font-bold text-[#1D2D00] truncate">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Calorie progress */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-[#1D2D00]/50">Today's calories</span>
                <span className="font-semibold" style={{ color: calColor }}>
                  {userProfile.currentCalories?.toLocaleString()} / {userProfile.dailyLimit?.toLocaleString()} kcal ({calPct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8F0D7]">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${calPct}%`, backgroundColor: calColor }} />
              </div>
            </div>

            {/* Allergies */}
            {userProfile.allergies && userProfile.allergies.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Allergies to avoid</p>
                <div className="flex flex-wrap gap-2">
                  {userProfile.allergies.map(a => (
                    <span key={a} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                      ⚠️ {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Generating spinner ────────────────────────────────────────── */}
        <AnimatePresence>
          {generating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mb-8 flex flex-col items-center justify-center rounded-2xl border border-[#E8F0D7] bg-white py-14 shadow-sm">
              <span className="h-12 w-12 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
              <p className="mt-4 font-semibold text-[#1D2D00]">Generating your personalised diet plan…</p>
              <p className="mt-1 text-sm text-[#1D2D00]/50">This may take a few seconds</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Diet plan content ─────────────────────────────────────────── */}
        {dietPlan && !generating && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="rounded-2xl border border-[#E8F0D7] bg-white shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="border-b border-[#E8F0D7] bg-[#F8FAF4] px-6 py-4">
              <h2 className="text-lg font-black text-[#1D2D00]">Personalised Diet Plan</h2>
              <p className="text-xs text-[#1D2D00]/50">Generated by AI based on your health profile</p>
            </div>

            {/* Rendered content */}
            <div className="px-6 py-6 space-y-1">
              {sections.map((s, i) => {
                if (s.type === 'spacer') return <div key={i} className="h-2" />;
                if (s.type === 'image') return (
                  <div key={i} className="my-4 overflow-hidden rounded-2xl border border-[#E8F0D7]">
                    <img src={s.content} alt="Meal" className="w-full h-56 object-cover"
                      onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                  </div>
                );
                if (s.type === 'h1') return (
                  <h2 key={i} className="mt-6 mb-2 text-2xl font-black text-[#1D2D00] border-b-2 border-[#90CD1D]/30 pb-2">
                    {renderBold(s.content)}
                  </h2>
                );
                if (s.type === 'h2') return (
                  <h3 key={i} className="mt-5 mb-2 text-xl font-black text-[#1D2D00]">
                    {renderBold(s.content)}
                  </h3>
                );
                if (s.type === 'h3') return (
                  <h4 key={i} className="mt-4 mb-1.5 text-base font-bold text-[#386641]">
                    {renderBold(s.content)}
                  </h4>
                );
                if (s.type === 'bullet') return (
                  <div key={i} className="flex items-start gap-2.5 py-0.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#90CD1D]" />
                    <p className="flex-1 text-sm leading-6 text-[#1D2D00]/80">{renderBold(s.content)}</p>
                  </div>
                );
                if (s.type === 'numbered') return (
                  <div key={i} className="flex items-start gap-2.5 py-0.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8F0D7] text-[10px] font-bold text-[#386641]">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-6 text-[#1D2D00]/80">{renderBold(s.content)}</p>
                  </div>
                );
                return (
                  <p key={i} className="text-sm leading-7 text-[#1D2D00]/80">{renderBold(s.content)}</p>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Regenerate ───────────────────────────────────────────────── */}
        {dietPlan && !generating && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => userProfile && generateDietPlan(userProfile)}
              className="flex items-center gap-2 rounded-xl bg-[#1D2D00] px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#386641]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate Plan
            </button>
            <a href="/all-foods"
              className="rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] px-7 py-3 text-sm font-semibold text-[#386641] transition-all hover:bg-[#E8F0D7]">
              Browse All Meals →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
