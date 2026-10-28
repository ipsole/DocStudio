'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading: authLoading, signUp, signInWithGoogle, isConfigured } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
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
              setError(err.message || 'Google sign up failed.');
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
        setError(fbErr.message || 'Google sign up failed.');
      }
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim(), password, displayName.trim());
      router.push('/dashboard');
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. If you created it with Google, please click "Continue with Google" or head to Sign In.');
      } else if (fbErr.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (fbErr.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(fbErr.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-4 px-4 sm:px-6 md:px-8 text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="w-full max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Left Column: Brand Hero with Logo Centered above DocStudio */}
        <div className="lg:col-span-6 flex flex-col items-center text-center justify-center space-y-3 select-none">
          <Link href="/" className="inline-flex items-center justify-center group" title="DocStudio">
            <DocdrilLogo size={76} className="text-neutral-950 dark:text-white transition-transform group-hover:scale-105" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif font-normal tracking-[0.01em] text-neutral-950 dark:text-white leading-[1.05]">
              DocStudio
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md mx-auto font-sans leading-relaxed">
              Create your unified account to unlock the entire suite of Docdril creative applications, motion sequencers, and document pipelines.
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

        {/* Right Column: Wider, Low-Height Sign Up Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-[530px] bg-white dark:bg-neutral-950/90 border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 space-y-3 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl text-neutral-900 dark:text-white">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
                Create Account
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                One central identity for the entire Docdril software suite
              </p>
            </div>

            {!isConfigured && (
              <div className="p-2.5 border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300 font-mono text-xs leading-relaxed rounded">
                <strong>NOTICE:</strong> Firebase configuration is pending in <code className="font-mono text-neutral-950 dark:text-white">.env.local</code>.
              </div>
            )}

            {error && (
              <div className="p-2.5 border border-red-300 bg-red-50 text-red-700 dark:border-red-800/80 dark:bg-red-950/70 dark:text-red-300 font-mono text-xs flex items-center gap-2 rounded">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 text-xs font-semibold h-10"
                onClick={handleGoogleSignUp}
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
              <p className="mt-1 text-center text-[10px] text-neutral-500 dark:text-neutral-400 font-sans">
                ⚡ 1-tap instant Google sign-in active on this screen
              </p>

              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <div className="relative flex justify-center font-mono text-[10px] uppercase">
                  <span className="bg-white dark:bg-neutral-950 px-2 text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">
                    Or register with email
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <Input
                    label="Full name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <Input
                    label="Email address"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <Input
                    label="Password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                  />
                </div>
                <div>
                  <Input
                    label="Confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-1 h-10 text-xs font-semibold"
                isLoading={loading}
                disabled={loading || !isConfigured}
              >
                Create Free Account
              </Button>
            </form>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-center font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Already have an account?{' '}
              <Link href="/sign-in" className="font-bold text-neutral-950 hover:text-neutral-700 dark:text-white underline ml-1 dark:hover:text-neutral-200">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
