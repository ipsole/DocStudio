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
    <div className="bg-white border border-neutral-950 p-8 sm:p-10 space-y-6 rounded-none">
      {!isConfigured && (
        <div className="p-3.5 border border-amber-300 bg-amber-50 text-amber-900 font-mono text-xs leading-relaxed">
          <strong>NOTICE:</strong> Firebase configuration is pending in <code className="font-mono">.env.local</code>.
        </div>
      )}

      {error && (
        <div className="p-3.5 border border-red-500 bg-red-50 text-red-700 font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 text-xs font-semibold"
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
        <p className="mt-2 text-center text-[11px] text-neutral-400 font-sans">
          ⚡ 1-tap instant Google sign-in active on this screen
        </p>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center font-mono text-[10px] uppercase">
            <span className="bg-white px-2 text-neutral-400 font-semibold tracking-wider">
              Or with email credentials
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-800">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-mono text-xs uppercase tracking-wider text-neutral-500 hover:text-black hover:underline"
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
          className="w-full mt-2"
          isLoading={loading}
          disabled={loading || !isConfigured}
        >
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-neutral-200 text-center font-mono text-xs uppercase tracking-wider text-neutral-500">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="font-bold text-neutral-950 underline ml-1">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-16 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <DocdrilLogo size={32} />
          <span className="font-bold text-2xl tracking-tight text-neutral-950 font-sans">
            DocStudio
          </span>
        </Link>
        <h2 className="text-3xl font-light tracking-[-0.03em] uppercase text-neutral-950 font-sans">
          Sign In
        </h2>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
          Access your unified Docdril software dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-white p-12 border border-neutral-950 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                Loading session...
              </p>
            </div>
          }
        >
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
