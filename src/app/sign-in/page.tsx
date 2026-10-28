'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Loader2 } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { user, loading: authLoading, signIn, signInWithGoogle, isConfigured } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectPath);
    }
  }, [user, authLoading, router, redirectPath]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          document.cookie = 'g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        } catch {
          // ignore
        }
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            signInWithGoogle().catch((err) => {
              setError(err.message || 'Google sign in failed.');
              setGoogleLoading(false);
            });
          } else {
            setGoogleLoading(false);
          }
        });
        return;
      }
      await signInWithGoogle();
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email address using password. Please sign in with your email and password.');
      } else if (fbErr.code !== 'auth/popup-closed-by-user') {
        setError(fbErr.message || 'Google sign in failed.');
      }
      setGoogleLoading(false);
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

      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 text-xs font-semibold h-11"
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
          Continue with Google
        </Button>
        <p className="mt-1.5 text-center text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
          ⚡ 1-tap instant Google sign-in active on this screen
        </p>

        <div className="relative my-3.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
          </div>
          <div className="relative flex justify-center font-mono text-[10px] uppercase">
            <span className="bg-white dark:bg-neutral-950 px-2 text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">
              Or with email credentials
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
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
            <label className="block font-mono text-xs uppercase tracking-wider font-semibold text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-mono text-xs uppercase tracking-wider text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:underline transition-colors"
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
          className="w-full mt-1 h-11"
          isLoading={loading}
          disabled={loading || !isConfigured}
        >
          Sign In
        </Button>
      </form>

      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 text-center font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="font-bold text-neutral-950 hover:text-neutral-700 dark:text-white underline ml-1 dark:hover:text-neutral-200">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-4 sm:py-6 px-4 sm:px-6 md:px-8 text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="w-full max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Brand Hero with Logo Centered above DocStudio */}
        <div className="lg:col-span-7 flex flex-col items-center text-center justify-center space-y-4 select-none">
          <Link href="/" className="inline-flex items-center justify-center group" title="DocStudio">
            <DocdrilLogo size={76} className="text-neutral-950 dark:text-white transition-transform group-hover:scale-105" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif font-normal tracking-[0.01em] text-neutral-950 dark:text-white leading-[1.05]">
              DocStudio
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md mx-auto font-sans leading-relaxed">
              The unified software ecosystem of Docdril. Sign in once to access creative canvases, motion sequencers, and document pipelines across all subdomains.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-1 text-xs font-mono text-neutral-600 dark:text-neutral-400">
            <span className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70">
              Single Sign-On
            </span>
            <span className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70">
              Shared Credits
            </span>
            <span className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70">
              All Subdomains
            </span>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <Suspense
              fallback={
                <div className="bg-white dark:bg-neutral-950 p-10 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm">
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
