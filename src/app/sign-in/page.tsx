'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';
import { AlertCircle, Loader2, Phone, Mail, ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react';
import type { ConfirmationResult } from 'firebase/auth';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const {
    user,
    loading: authLoading,
    signIn,
    signInWithGoogle,
    signInWithApple,
    setupRecaptcha,
    sendPhoneOtp,
    confirmPhoneOtp,
    isConfigured,
  } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectPath);
    }
  }, [user, authLoading, router, redirectPath]);

  // Auth method: 'email' | 'phone'
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone OTP form state
  const [countryCode, setCountryCode] = useState('+91');
  const [nationalNumber, setNationalNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      router.push(redirectPath);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (
        fbErr.code === 'auth/invalid-credential' ||
        fbErr.code === 'auth/wrong-password' ||
        fbErr.code === 'auth/user-not-found'
      ) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (fbErr.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again in a few minutes.');
      } else {
        setError(fbErr.message || 'An error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push(redirectPath);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email address using password. Please sign in with your email and password.');
      } else if (fbErr.code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (fbErr.code !== 'auth/popup-closed-by-user') {
        setError(fbErr.message || 'Google sign in failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setAppleLoading(true);
    try {
      await signInWithApple();
      router.push(redirectPath);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code !== 'auth/popup-closed-by-user') {
        setError(fbErr.message || 'Apple sign in failed.');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  // Send Phone OTP via SMS
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = nationalNumber.replace(/[\s-]/g, '').replace(/^0+/, '');
    if (!cleanDigits) {
      setError('Please enter your phone number.');
      return;
    }
    setError(null);
    setOtpLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${cleanDigits}`;
      const verifier = setupRecaptcha('phone-recaptcha-container');
      const confirmation = await sendPhoneOtp(fullPhoneNumber, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/invalid-phone-number') {
        setError(`Please enter a valid phone number for country code ${countryCode}.`);
      } else if (
        fbErr.code === 'auth/operation-not-allowed' ||
        fbErr.message?.toLowerCase().includes('region')
      ) {
        setError(
          `SMS delivery for ${countryCode} is currently disabled in your Firebase Console. Please enable region ${countryCode} in Firebase Console > Authentication > Settings > SMS region policy.`
        );
      } else if (fbErr.code === 'auth/too-many-requests' || fbErr.code === 'auth/quota-exceeded') {
        setError('SMS quota limit reached. Please sign in using Google, Apple, or Email.');
      } else {
        setError(fbErr.message || 'Failed to send SMS verification code.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify 6-digit Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !confirmationResult) return;
    setError(null);
    setOtpLoading(true);

    try {
      await confirmPhoneOtp(confirmationResult, otpCode.trim());
      router.push(redirectPath);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/invalid-verification-code') {
        setError('Incorrect 6-digit code. Please verify and try again.');
      } else if (fbErr.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new code.');
      } else {
        setError(fbErr.message || 'Failed to verify code.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-950/90 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-7 space-y-4 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl text-neutral-900 dark:text-white">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
          Sign In
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
          Access your unified Docdril software dashboard
        </p>
      </div>

      {/* Invisible reCAPTCHA container for SMS verification */}
      <div id="phone-recaptcha-container"></div>

      {!isConfigured && (
        <div className="p-3 border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300 font-mono text-xs leading-relaxed rounded">
          <strong>NOTICE:</strong> Firebase configuration is pending in <code className="font-mono text-neutral-950 dark:text-white">.env.local</code>.
        </div>
      )}

      {error && (
        <div className="p-3 border border-red-300 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/70 dark:text-red-300 font-mono text-xs flex items-center gap-2 rounded">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Social Single Sign-On (Google & Apple) */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 text-xs font-semibold h-11 cursor-pointer"
          onClick={handleGoogleSignIn}
          isLoading={googleLoading}
          disabled={googleLoading || !isConfigured}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          className="w-full gap-2 text-xs font-semibold h-11 cursor-pointer"
          onClick={handleAppleSignIn}
          isLoading={appleLoading}
          disabled={appleLoading || !isConfigured}
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.66 1.38-.56.65-1.06 1.71-.93 2.74 1.04.08 2.06-.5 2.67-1.25z" />
          </svg>
          <span>Continue with Apple</span>
        </Button>
      </div>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-white dark:bg-neutral-950 px-2.5 text-neutral-400 font-medium">
            or choose sign-in method
          </span>
        </div>
      </div>

      {/* Auth Method Switcher: Email vs Phone OTP */}
      <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setAuthMethod('email');
            setError(null);
          }}
          className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            authMethod === 'email'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Password</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMethod('phone');
            setError(null);
          }}
          className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            authMethod === 'phone'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Phone & OTP</span>
        </button>
      </div>

      {/* 1. EMAIL FORM */}
      {authMethod === 'email' && (
        <form onSubmit={handleSubmit} className="space-y-3.5 animate-fadeIn">
          <div>
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-sans text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="font-sans text-xs text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:underline transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-1 h-11 cursor-pointer"
            isLoading={loading}
            disabled={loading || !isConfigured}
          >
            Sign In with Email
          </Button>
        </form>
      )}

      {/* 2. PHONE OTP FORM */}
      {authMethod === 'phone' && (
        <div className="animate-fadeIn">
          {!otpSent ? (
            /* Step A: Request OTP */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <PhoneInputWithCountry
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                nationalNumber={nationalNumber}
                setNationalNumber={setNationalNumber}
                disabled={otpLoading}
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 cursor-pointer font-semibold"
                isLoading={otpLoading}
                disabled={otpLoading || !nationalNumber.trim()}
              >
                Send Verification Code
              </Button>
            </form>
          ) : (
            /* Step B: Verify OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500">Code sent to:</span>{' '}
                  <strong className="font-mono text-neutral-950 dark:text-white font-bold bg-neutral-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 ml-1">
                    {countryCode} {nationalNumber}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setError(null);
                  }}
                  className="text-xs text-neutral-700 dark:text-neutral-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div>
                <label className="block font-sans text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  6-Digit SMS Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 focus:border-neutral-950 dark:focus:border-white bg-white dark:bg-neutral-900/90 pl-10 pr-3.5 py-2.5 text-base tracking-[0.3em] font-mono font-bold text-center text-neutral-900 dark:text-white focus:outline-none transition-colors placeholder:tracking-normal placeholder:font-normal placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 cursor-pointer"
                isLoading={otpLoading}
                disabled={otpLoading || otpCode.length < 6}
              >
                Verify & Sign In
              </Button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading}
                className="w-full text-center text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer pt-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resend SMS Code</span>
              </button>
            </form>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 text-center font-sans text-xs text-neutral-500 dark:text-neutral-400">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="font-semibold text-neutral-950 hover:text-neutral-700 dark:text-white underline ml-1 dark:hover:text-neutral-200">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-4 px-4 sm:px-6 md:px-8 text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="w-full max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Left Column: Brand Hero with Large Logo Centered above DocStudio */}
        <div className="lg:col-span-6 flex flex-col items-center text-center justify-center space-y-4 select-none">
          <Link href="/" className="inline-flex items-center justify-center group" title="DocStudio">
            <DocdrilLogo size={132} className="text-neutral-950 dark:text-white transition-transform group-hover:scale-105 drop-shadow-sm" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif font-normal tracking-[0.01em] text-neutral-950 dark:text-white leading-[1.05]">
              DocStudio
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md mx-auto font-sans leading-relaxed">
              The unified software ecosystem of Docdril. Sign in once to access creative canvases, motion sequencers, and document pipelines across all subdomains.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-1 text-xs font-sans text-neutral-600 dark:text-neutral-400">
            <span className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70 font-medium">
              Single Sign-On
            </span>
            <span className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70 font-medium">
              Shared Credits
            </span>
            <span className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70 font-medium">
              All Subdomains
            </span>
          </div>
        </div>

        {/* Right Column: Wider, Low-Height Sign In Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-[490px]">
            <Suspense
              fallback={
                <div className="bg-white dark:bg-neutral-950 p-8 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                  <p className="font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Loading session...
                  </p>
                </div>
              }
            >
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
