'use client';

import { useState, useRef, useEffect } from 'react';

interface UserHealthProfile {
  weight?: number; height?: number; age?: number;
  gender?: 'male' | 'female'; activityLevel?: string;
  healthGoal?: string; targetCalories?: number;
}
interface HealthRecommendations {
  healthAnalysis: { bmi: number; bmiCategory: string; recommendedCalories: number; healthStatus: string };
  recommendedFoods: Array<{
    id: number; name: string; price: number; image_url?: string;
    total_calories: number; suitability_score: number;
    restaurant: { id: number; name: string };
  }>;
  aiRecommendations: string;
}
type Step = 'welcome'|'weight'|'height'|'age'|'gender'|'activity'|'goal'|'target_calories'|'results';
const STEPS: Step[] = ['welcome','weight','height','age','gender','activity','goal','target_calories','results'];

export default function HealthChatPanel() {
  const [step, setStep] = useState<Step>('welcome');
  const [profile, setProfile] = useState<UserHealthProfile>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [recs, setRecs] = useState<HealthRecommendations|null>(null);

  const next = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };

  const submit = async (value: string) => {
    const updated = { ...profile };
    if (step === 'weight')           updated.weight = parseFloat(value);
    else if (step === 'height')      updated.height = parseFloat(value);
    else if (step === 'age')         updated.age = parseInt(value);
    else if (step === 'gender')      updated.gender = value as 'male'|'female';
    else if (step === 'activity')    updated.activityLevel = value;
    else if (step === 'goal')        updated.healthGoal = value;
    else if (step === 'target_calories' && value) updated.targetCalories = parseFloat(value);
    setProfile(updated);
    setInput('');

    const nextStep = STEPS[STEPS.indexOf(step) + 1];
    if (nextStep === 'results') {
      setLoading(true); setError(null);
      try {
        const res = await fetch('/api/health-food-recommendations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        const data = await res.json();
        if (data.success) { setRecs(data); setStep('results'); }
        else setError(data.error || 'Failed to get recommendations');
      } catch { setError('Network error'); }
      finally { setLoading(false); }
    } else {
      setStep(nextStep);
    }
  };

  const reset = () => { setStep('welcome'); setProfile({}); setRecs(null); setError(null); setInput(''); };

  const inputClass = "w-full rounded-xl border border-[#C8DFA0] px-4 py-2.5 text-sm focus:border-[#90CD1D] focus:outline-none focus:ring-2 focus:ring-[#90CD1D]/20 mb-3";
  const btnPrimary = "w-full rounded-xl bg-[#386641] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D2D00] disabled:bg-gray-300";
  const btnOption = "w-full rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] px-4 py-2.5 text-left text-sm font-medium text-[#1D2D00] transition-colors hover:bg-[#D6EAB8]";

  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
      <p className="text-sm text-gray-500">Analysing your profile…</p>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center">
      <div className="mb-3 text-4xl">😞</div>
      <p className="mb-4 text-sm text-gray-600">{error}</p>
      <button onClick={reset} className={btnPrimary}>Try Again</button>
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      {step === 'welcome' && (
        <div className="text-center pt-4">
          <div className="mb-3 text-5xl">😋</div>
          <h3 className="mb-2 text-lg font-bold text-[#1D2D00]">Personalised Recommendations</h3>
          <p className="mb-6 text-sm text-gray-500">I'll analyse your health profile and suggest the best meals for your goals.</p>
          <button onClick={next} className={btnPrimary}>Get Started 🚀</button>
        </div>
      )}

      {step === 'weight' && (
        <>
          <p className="font-semibold text-[#1D2D00]">Your current weight (kg)</p>
          <input type="number" placeholder="e.g. 70" className={inputClass} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && input && submit(input)} />
          <button onClick={() => input && submit(input)} disabled={!input} className={btnPrimary}>Next →</button>
        </>
      )}

      {step === 'height' && (
        <>
          <p className="font-semibold text-[#1D2D00]">Your height (cm)</p>
          <input type="number" placeholder="e.g. 175" className={inputClass} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && input && submit(input)} />
          <button onClick={() => input && submit(input)} disabled={!input} className={btnPrimary}>Next →</button>
        </>
      )}

      {step === 'age' && (
        <>
          <p className="font-semibold text-[#1D2D00]">Your age</p>
          <input type="number" placeholder="e.g. 25" className={inputClass} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && input && submit(input)} />
          <button onClick={() => input && submit(input)} disabled={!input} className={btnPrimary}>Next →</button>
        </>
      )}

      {step === 'gender' && (
        <>
          <p className="font-semibold text-[#1D2D00]">Your gender</p>
          <div className="space-y-2">
            <button onClick={() => submit('male')} className={btnOption}>👨 Male</button>
            <button onClick={() => submit('female')} className={btnOption}>👩 Female</button>
          </div>
        </>
      )}

      {step === 'activity' && (
        <>
          <p className="font-semibold text-[#1D2D00]">Activity level</p>
          <div className="space-y-2">
            {[
              ['sedentary',  '🛋️ Sedentary'],
              ['light',      '🚶 Light (1–3 days/week)'],
              ['moderate',   '🏃 Moderate (3–5 days/week)'],
              ['active',     '💪 Active (6–7 days/week)'],
              ['very_active','🏋️ Very Active'],
            ].map(([v, l]) => <button key={v} onClick={() => submit(v)} className={btnOption}>{l}</button>)}
          </div>
        </>
      )}

      {step === 'goal' && (
        <>
          <p className="font-semibold text-[#1D2D00]">Health goal</p>
          <div className="space-y-2">
            {[
              ['weight_loss',    '📉 Lose Weight'],
              ['weight_gain',    '📈 Gain Weight'],
              ['maintenance',    '⚖️ Maintain Weight'],
              ['muscle_gain',    '💪 Build Muscle'],
              ['general_health', '🌟 General Wellness'],
            ].map(([v, l]) => <button key={v} onClick={() => submit(v)} className={btnOption}>{l}</button>)}
          </div>
        </>
      )}

      {step === 'target_calories' && (
        <>
          <p className="font-semibold text-[#1D2D00]">Target calories/day <span className="text-xs font-normal text-gray-400">(optional)</span></p>
          <input type="number" placeholder="e.g. 2000" className={inputClass} value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={() => submit(input || '0')} className={btnPrimary}>Get Recommendations</button>
          <button onClick={() => submit('0')} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50">Let AI calculate for me</button>
        </>
      )}

      {step === 'results' && recs && (
        <div className="space-y-4">
          {/* Health summary */}
          <div className="rounded-xl bg-[#F0F4E8] p-4">
            <p className="mb-2 font-semibold text-[#1D2D00]">Your Health Summary</p>
            <div className="space-y-1 text-sm text-[#1D2D00]/70">
              <p>BMI: <strong className="text-[#1D2D00]">{recs.healthAnalysis.bmi}</strong> ({recs.healthAnalysis.bmiCategory})</p>
              <p>Recommended: <strong className="text-[#1D2D00]">{recs.healthAnalysis.recommendedCalories} cal/day</strong></p>
              <p>{recs.healthAnalysis.healthStatus}</p>
            </div>
          </div>

          {/* AI advice */}
          <div className="rounded-xl bg-[#EDF3E8] p-4">
            <p className="mb-1 font-semibold text-[#1D2D00]">Personalised Advice</p>
            <p className="text-sm text-[#1D2D00]/70">{recs.aiRecommendations}</p>
          </div>

          {/* Food list */}
          <div>
            <p className="mb-2 font-semibold text-[#1D2D00]">Recommended Foods</p>
            <div className="space-y-2">
              {recs.recommendedFoods.map(food => (
                <div key={food.id} className="flex gap-3 rounded-xl border border-[#E8F0D7] bg-white p-3 hover:border-[#90CD1D] hover:shadow-sm transition-all">
                  {food.image_url
                    ? <img src={food.image_url} alt={food.name} className="h-12 w-12 rounded-lg object-cover" />
                    : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8F0D7] text-xl">🍽️</div>}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1D2D00]">{food.name}</p>
                    <p className="text-xs text-gray-400">{food.restaurant.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-[#386641]">PKR {food.price}</span>
                      <span className="text-xs text-gray-400">{food.total_calories} cal</span>
                      <span className="rounded-full bg-[#E8F0D7] px-2 py-0.5 text-xs font-medium text-[#386641]">{food.suitability_score}% match</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={reset} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50">Start Over</button>
        </div>
      )}
    </div>
  );
}