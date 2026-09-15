'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type AuthMessage = { type: 'success' | 'error'; text: string };

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function RestaurantAuth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantName: '',
    registrationNumber: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'registrationNumber') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 16) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const result = await res.json();
        if (result.success) {
          const { ClientAuth } = await import('../../lib/auth/jwt-auth');
          ClientAuth.setToken(result.token);
          setMessage({ type: 'success', text: 'Login successful! Redirecting…' });
          setTimeout(() => router.push('/restaurent-dashboard'), 900);
        } else {
          setMessage({ type: 'error', text: result.error || 'Login failed.' });
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match.' });
          setLoading(false);
          return;
        }
        if (!formData.registrationNumber.match(/^REG-[A-Z]{2,4}-\d{4}-\d{4}$/)) {
          setMessage({ type: 'error', text: 'Registration number must follow the format REG-ISB-2021-0101.' });
          setLoading(false);
          return;
        }

        const { data: existingEmail } = await supabase
          .from('restaurant_user').select('email').eq('email', formData.email).single();
        if (existingEmail) {
          setMessage({ type: 'error', text: 'Email already exists.' });
          setLoading(false);
          return;
        }

        const { data: existingReg } = await supabase
          .from('restaurant_user').select('registration_number')
          .eq('registration_number', formData.registrationNumber).single();
        if (existingReg) {
          setMessage({ type: 'error', text: 'Registration number already in use.' });
          setLoading(false);
          return;
        }

        const { error } = await supabase.from('restaurant_user').insert([{
          email: formData.email,
          password: formData.password,
          name: formData.restaurantName,
          registration_number: formData.registrationNumber,
        }]);

        if (error) {
          setMessage({ type: 'error', text: 'Error creating account: ' + error.message });
        } else {
          setMessage({ type: 'success', text: 'Account created! Please sign in.' });
          setTimeout(() => {
            setIsLogin(true);
            setFormData({ email: '', password: '', restaurantName: '', registrationNumber: '', confirmPassword: '' });
            setMessage(null);
          }, 1200);
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(v => !v);
    setMessage(null);
    setShowPassword(false);
    setShowConfirm(false);
    setFormData({ email: '', password: '', restaurantName: '', registrationNumber: '', confirmPassword: '' });
  };

  const inputClass =
    'w-full rounded-xl border border-[#C8DFA0] bg-white px-4 py-3 text-sm text-[#1D2D00] placeholder:text-[#1D2D00]/40 outline-none transition-all focus:border-[#90CD1D] focus:ring-2 focus:ring-[#90CD1D]/20';
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#386641]';

  return (
    <div className="min-h-screen bg-[#F8FAF4] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(29,45,0,0.12)] lg:grid lg:grid-cols-[1fr_1.3fr]">

        {/* Left panel */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-8 h-56 w-56 rounded-full bg-[#D6F0A4]/10 blur-3xl" />

          <div className="relative">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/images/dp-logo.jpeg" alt="PlatePilot" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#90CD1D]/40" />
              <span className="text-lg font-bold text-white">PlatePilot</span>
            </Link>
            <h1 className="mt-10 text-3xl font-black leading-tight text-white">
              Restaurant{' '}
              <span className="bg-gradient-to-r from-[#D6F0A4] to-[#90CD1D] bg-clip-text text-transparent">Portal</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/60">
              Manage your menu, publish deals, and track incoming orders — all from one clean dashboard.
            </p>
          </div>

          <div className="relative mt-10 space-y-3">
            {['Publish and manage your menu', 'AI-generated deal suggestions', 'Real-time order tracking', 'Healthy dish recommendations', 'Waste-free recipe ideas'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#90CD1D]/20">
                  <svg className="h-3 w-3 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm text-white/70">{f}</span>
              </div>
            ))}
          </div>

          <div className="relative mt-10 flex gap-8 border-t border-white/10 pt-8">
            {[['8+', 'Restaurants'], ['25+', 'Menu Items'], ['9+', 'Active Deals']].map(([v, l]) => (
              <div key={l}>
                <p className="text-xl font-black text-[#90CD1D]">{v}</p>
                <p className="text-xs text-white/50">{l}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Right panel */}
        <div className="bg-white px-8 py-10 sm:px-10">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/images/dp-logo.jpeg" alt="PlatePilot" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-bold text-[#1D2D00]">PlatePilot</span>
          </Link>

          {/* Tab switcher */}
          <div className="flex rounded-2xl border border-[#E8F0D7] bg-[#F0F4E8] p-1">
            {['Login', 'Sign Up'].map((tab, i) => {
              const active = isLogin ? i === 0 : i === 1;
              return (
                <button key={tab} type="button" onClick={() => (i === 0 ? setIsLogin(true) : setIsLogin(false))}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all duration-200 ${active ? 'bg-[#1D2D00] text-white shadow-sm' : 'text-[#386641] hover:bg-[#E8F0D7]'}`}>
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="mt-7">
            <h2 className="text-2xl font-black text-[#1D2D00]">{isLogin ? 'Welcome back' : 'Register restaurant'}</h2>
            <p className="mt-1 text-sm text-[#1D2D00]/50">
              {isLogin ? 'Sign in to continue to your restaurant dashboard.' : 'Create your restaurant account to start listing meals and deals.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {message && (
              <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'border-[#90CD1D]/40 bg-[#E8F0D7] text-[#386641]' : 'border-red-200 bg-red-50 text-red-600'}`}>
                {message.text}
              </div>
            )}

            {!isLogin && (
              <label className="block">
                <span className={labelClass}>Restaurant Name</span>
                <input type="text" name="restaurantName" value={formData.restaurantName}
                  onChange={handleInputChange} required={!isLogin}
                  placeholder="e.g. Sweetgreen Lahore" className={inputClass} />
              </label>
            )}

            {!isLogin && (
              <div>
                <label className="block">
                  <span className={labelClass}>Registration Number</span>
                  <input type="text" name="registrationNumber" value={formData.registrationNumber}
                    onChange={handleInputChange} required={!isLogin}
                    placeholder="REG-ISB-2021-0101" className={inputClass} />
                </label>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#1D2D00]/40">
                  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Format: <span className="font-mono font-semibold text-[#386641]">REG-ISB-2021-0101</span>
                  &nbsp;(REG-CITY-YEAR-NUMBER)
                </p>
              </div>
            )}

            <label className="block">
              <span className={labelClass}>Email Address</span>
              <input type="email" name="email" value={formData.email}
                onChange={handleInputChange} required
                placeholder="you@restaurant.com" className={inputClass} />
            </label>

            {/* Password with show/hide */}
            <label className="block">
              <span className={labelClass}>Password</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                  onChange={handleInputChange} required placeholder="••••••••"
                  className={`${inputClass} pr-11`} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1D2D00]/40 transition-colors hover:text-[#386641]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            {/* Confirm password with show/hide */}
            {!isLogin && (
              <label className="block">
                <span className={labelClass}>Confirm Password</span>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleInputChange} required={!isLogin} placeholder="••••••••"
                    className={`${inputClass} pr-11`} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1D2D00]/40 transition-colors hover:text-[#386641]"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </label>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#386641] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#1D2D00]/50">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={toggleMode} className="ml-1.5 font-semibold text-[#386641] transition-colors hover:text-[#1D2D00]">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          <p className="mt-3 text-center">
            <button onClick={() => router.push('/user-login')}
              className="text-xs text-[#1D2D00]/40 transition-colors hover:text-[#386641]">
              Switch to User Login →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
