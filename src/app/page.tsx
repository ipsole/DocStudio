'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getPublicApps } from '@/lib/firebase/db';
import { DocApp } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, signInWithGoogle, isConfigured } = useAuth();
  const [apps, setApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const fetched = await getPublicApps();
        setApps(fetched);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleError(null);
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
              setGoogleError(err.message || 'Google sign in failed');
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
      const fbErr = err as { message?: string };
      setGoogleError(fbErr.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center bg-white text-neutral-900 dark:bg-black dark:text-white px-4 sm:px-6 md:px-8 pt-0 sm:pt-1 pb-12 sm:pb-16 overflow-hidden transition-colors duration-200">
      {/* Luxury Serif Typography matching shared design */}
      <div className="relative z-10 text-center select-none pt-0 pb-6 sm:pb-10">
        <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-serif font-normal tracking-normal text-neutral-950 dark:text-white leading-none select-none">
          DocStudio
        </h1>
      </div>

      {/* Directly Below: If Authenticated, Show Softwares with Clean Card Effects */}
      {user ? (
        <div className="relative z-10 w-full max-w-[1400px] mx-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {apps.map((app) => (
                <AppCard key={app.id} app={app} showLaunchDirect={true} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* If Logged Out: Minimal 1-Click Login */
        <div className="relative z-10 w-full max-w-sm mx-auto text-center space-y-4 pt-4">
          {googleError && (
            <div className="p-3 border border-red-500 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 font-mono text-xs rounded">
              {googleError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || !isConfigured}
            className="w-full h-12 px-6 bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-semibold text-xs tracking-wider uppercase rounded-full flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white dark:text-black" />
            ) : (
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
            )}
            <span>Continue with Google</span>
          </button>

          <div className="pt-2 flex items-center justify-center gap-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            <Link
              href="/sign-in"
              className="hover:text-black dark:hover:text-white transition-colors underline underline-offset-4"
            >
              Sign In with Email
            </Link>
            <span>•</span>
            <Link
              href="/sign-up"
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
