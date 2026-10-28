'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { renderUserIcon } from '@/components/ui/AvatarIconPicker';
import {
  User as UserIcon,
  ArrowRight,
  LogOut,
  Settings,
  LayoutDashboard,
  Shield,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function HomePage() {
  const { user, profile, isAdmin, signInWithGoogle, signOut, isConfigured } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

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
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-black text-white px-4 sm:px-6 overflow-hidden select-none">
      {/* Ambient ethereal white spotlight glow behind DocStudio */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-10 sm:space-y-14 py-12">
        {/* Top Header & Glow */}
        <div className="space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-neutral-800 bg-neutral-950/70 backdrop-blur-md rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-neutral-300 font-semibold">
              THE UNIFIED SOFTWARE PLATFORM
            </span>
          </div>

          {/* Majestic Glowing White DocStudio */}
          <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-extrabold tracking-[-0.04em] text-white uppercase font-sans leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.75)] drop-shadow-[0_0_90px_rgba(255,255,255,0.3)]">
            DocStudio
          </h1>

          <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.4em] text-neutral-400 font-medium">
            BY DOCDRIL
          </p>
        </div>

        {/* Minimal Account & Login Gateway */}
        <div className="w-full max-w-sm mx-auto">
          {user ? (
            /* Logged In State: Account-Icon Based Portal */
            <div className="border border-neutral-800 bg-neutral-950/90 p-6 sm:p-7 space-y-6 shadow-2xl backdrop-blur-xl rounded-none text-left">
              {/* Account Icon Header */}
              <div className="flex items-center gap-4 border-b border-neutral-900 pb-5">
                <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center text-white shrink-0 shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                  {profile?.avatarIcon ? (
                    renderUserIcon(profile.avatarIcon, 'w-7 h-7 text-white')
                  ) : (
                    <UserIcon className="w-7 h-7 text-white" />
                  )}
                </div>

                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-base font-bold text-white tracking-tight truncate">
                      {profile?.displayName || user.displayName || 'DocStudio User'}
                    </h3>
                    {isAdmin && (
                      <span className="font-mono text-[9px] uppercase tracking-wider bg-white text-black font-bold px-1.5 py-0.5">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-neutral-400 truncate">
                    {user.email}
                  </p>
                  <p className="font-mono text-[10px] uppercase text-emerald-400 font-semibold tracking-wider">
                    ● Authenticated & Active
                  </p>
                </div>
              </div>

              {/* Minimal Navigation Buttons */}
              <div className="space-y-2.5">
                <Link href="/dashboard" className="block w-full">
                  <button
                    type="button"
                    className="w-full h-11 px-5 bg-white hover:bg-neutral-200 text-black font-sans font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-between group rounded-none"
                  >
                    <span>Enter Studio Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link href="/account">
                    <button
                      type="button"
                      className="w-full h-10 px-3 border border-neutral-800 hover:border-neutral-600 bg-neutral-900/60 text-neutral-300 hover:text-white font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Account</span>
                    </button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full h-10 px-3 border border-neutral-800 hover:border-red-900 bg-neutral-900/60 text-neutral-400 hover:text-red-400 font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Logged Out State: Ultra-Minimalist Floating Login */
            <div className="space-y-4">
              {googleError && (
                <div className="p-3 border border-red-800 bg-red-950/40 text-red-300 font-mono text-xs text-center">
                  {googleError}
                </div>
              )}

              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || !isConfigured}
                className="w-full h-12 px-6 bg-white hover:bg-neutral-200 text-black font-semibold text-xs tracking-wider uppercase rounded-full flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_35px_rgba(255,255,255,0.25)] cursor-pointer"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
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

              {/* Minimal Email Sign In Link */}
              <div className="pt-2 flex items-center justify-center gap-3 font-mono text-xs text-neutral-400">
                <Link
                  href="/sign-in"
                  className="hover:text-white transition-colors underline underline-offset-4"
                >
                  Sign In with Email
                </Link>
                <span>•</span>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  Create Account
                </Link>
              </div>

              <p className="text-center font-mono text-[10px] uppercase tracking-wider text-neutral-500 pt-1">
                ⚡ 1-Tap Google One Tap active
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
