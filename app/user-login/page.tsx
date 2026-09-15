'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function UserLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [message, setMessage] = useState<AuthMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMessage(null);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match.' });
          setLoading(false);
          return;
        }
        if (!formData.username || !formData.email || !formData.password) {
          setMessage({ type: 'error', text: 'Please complete all required fields.' });
          setLoading(false);
          return;
        }
      } else {
        if (!formData.email || !formData.password) {
          setMessage({ type: 'error', text: 'Please enter email and password.' });
          setLoading(false);
          return;
        }
      }

      const endpoint = isLogin ? '/api/user-auth/login' : '/api/user-auth/signup';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password, profileImage };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (result.success) {
        if (isLogin) {
          localStorage.setItem('userToken', result.token);
          localStorage.setItem('userData', JSON.stringify(result.user));
          router.push('/user-dashboard');
        } else {
          setMessage({ type: 'success', text: 'Account created! Please sign in.' });
          setTimeout(() => {
            setIsLogin(true);
            setFormData({ username: '', email: '', password: '', confirmPassword: '' });
            setProfileImage(null);
          }, 900);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Authentication failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(v => !v);
    setMessage(null);
    setShowPassword(false);
    setShowConfirm(false);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setProfileImage(null);
  };

  const inputClass =
    'w-full rounded-xl border border-[#C8DFA0] bg-white px-4 py-3 text-sm text-[#1D2D00] placeholder:text-[#1D2D00]/40 outline-none transition-all focus:border-[#90CD1D] focus:ring-2 focus:ring-[#90CD1D]/20';
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#386641]';

  return (
    <div className="min-h-screen bg-[#F8FAF4] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(29,45,0,0.12)] lg:grid lg:grid-cols-[1fr_1.3fr]">

        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1D2D00] via-[#2A4000] to-[#386641] p-10 lg:flex lg:flex-col lg:justify-between">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#90CD1D]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-8 h-56 w-56 rounded-full bg-[#D6F0A4]/10 blur-3xl" />

          <div className="relative">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/images/dp-logo.jpeg" alt="PlatePilot" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#90CD1D]/40" />
              <span className="text-lg font-bold text-white">PlatePilot</span>
            </Link>

            <h1 className="mt-10 text-3xl font-black leading-tight text-white">
              Eat Smarter,{' '}
              <span className="bg-gradient-to-r from-[#D6F0A4] to-[#90CD1D] bg-clip-text text-transparent">
                Live Better
              </span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/60">
              Sign in to explore healthy meals, track calories, manage your cart, and get AI-powered nutrition recommendations.
            </p>
          </div>

          {/* Feature list */}
          <div className="relative mt-10 space-y-3">
            {[
              'Personalised meal recommendations',
              'Real-time calorie tracking',
              'Exclusive restaurant deals',
              'AI-powered diet plans',
            ].map(f => (
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
        </aside>

        {/* ── Right panel (form) ──────────────────────────────────────────── */}
        <div className="bg-white px-8 py-10 sm:px-10">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/images/dp-logo.jpeg" alt="PlatePilot" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-bold text-[#1D2D00]">PlatePilot</span>
          </Link>

          {/* Tab switcher */}
          <div className="flex rounded-2xl border border-[#E8F0D7] bg-[#F0F4E8] p-1">
            {['Login', 'Sign Up'].map((tab, i) => {
              const active = isLogin ? i === 0 : i === 1;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => (i === 0 ? setIsLogin(true) : setIsLogin(false))}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-[#1D2D00] text-white shadow-sm'
                      : 'text-[#386641] hover:bg-[#E8F0D7]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="mt-7">
            <h2 className="text-2xl font-black text-[#1D2D00]">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="mt-1 text-sm text-[#1D2D00]/50">
              {isLogin
                ? 'Sign in to continue to your dashboard.'
                : 'Set up your account to begin your wellness journey.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Message */}
            {message && (
              <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                message.type === 'success'
                  ? 'border-[#90CD1D]/40 bg-[#E8F0D7] text-[#386641]'
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            {/* Profile image upload (signup only) */}
            {!isLogin && (
              <div className="flex items-center gap-4 rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#C8DFA0] bg-[#E8F0D7]">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-7 w-7 text-[#90CD1D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer rounded-xl border border-[#C8DFA0] bg-white px-4 py-2 text-sm font-medium text-[#386641] transition-all hover:bg-[#E8F0D7]">
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* Username (signup only) */}
            {!isLogin && (
              <label className="block">
                <span className={labelClass}>Username</span>
                <input type="text" name="username" value={formData.username}
                  onChange={handleInputChange} required={!isLogin}
                  placeholder="Your username" className={inputClass} />
              </label>
            )}

            {/* Email */}
            <label className="block">
              <span className={labelClass}>Email Address</span>
              <input type="email" name="email" value={formData.email}
                onChange={handleInputChange} required
                placeholder="you@example.com" className={inputClass} />
            </label>

            {/* Password */}
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

            {/* Confirm password (signup only) */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#386641] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isLogin ? 'Signing in…' : 'Creating account…'
                : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-sm text-[#1D2D00]/50">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={toggleMode}
              className="ml-1.5 font-semibold text-[#386641] transition-colors hover:text-[#1D2D00]">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          {/* Restaurant login */}
          <p className="mt-3 text-center">
            <button onClick={() => router.push('/restaurent')}
              className="text-xs text-[#1D2D00]/40 transition-colors hover:text-[#386641]">
              Switch to Restaurant Login →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
