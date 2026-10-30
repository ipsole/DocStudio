'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { getUserSubscriptions } from '@/lib/firebase/db';
import { AppSubscription } from '@/types';
import {
  LogOut,
  LayoutDashboard,
  Settings,
  Shield,
  User as UserIcon,
  Sun,
  Moon,
  Zap,
  Sparkles,
} from 'lucide-react';

const NAV_TABS = [
  { name: 'Home', href: '/' },
  { name: 'Softwares', href: '/apps' },
  { name: 'Pricings', href: '/pricing' },
  { name: 'Tutorials', href: '/tutorials' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasSessionHint, setHasSessionHint] = useState(false);
  const [subscriptions, setSubscriptions] = useState<AppSubscription[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      setHasSessionHint(Boolean(localStorage.getItem('docstudio_has_session')));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (user) {
          setHasSessionHint(true);
          const cached = localStorage.getItem(`docstudio_subscriptions_${user.uid}`);
          if (cached) setSubscriptions(JSON.parse(cached));
          getUserSubscriptions(user.uid).then((subs) => {
            if (subs && subs.length > 0) setSubscriptions(subs);
          });
        } else if (!loading) {
          setHasSessionHint(false);
          setSubscriptions([]);
        }
      } catch {
        // ignore
      }
    }
  }, [user, loading]);

  const totalCreditsRemaining = subscriptions.reduce(
    (acc, s) => acc + (s.creditsRemaining || 0),
    0
  );
  const totalCreditsMax = subscriptions.reduce(
    (acc, s) => acc + (s.creditsTotal || 0),
    0
  );
  const creditsPercentage =
    totalCreditsMax > 0
      ? Math.min(100, Math.round((totalCreditsRemaining / totalCreditsMax) * 100))
      : totalCreditsRemaining > 0
      ? 100
      : 0;
  const activePlanName = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return 'Starter';
    if (subscriptions.some((s) => s.plan === 'enterprise')) return 'Ultra';
    if (subscriptions.some((s) => s.plan === 'pro')) return 'Pro';
    return 'Starter';
  }, [subscriptions]);

  // Sliding pill indicator for Navbar top navigation
  const navTabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const [navIndicator, setNavIndicator] = useState<{
    left: number;
    width: number;
    top: number;
    height: number;
    ready: boolean;
  }>({
    left: 0,
    width: 0,
    top: 0,
    height: 0,
    ready: false,
  });

  const activeTabName = useMemo(() => {
    if (pathname === '/') return 'Home';
    if (pathname?.startsWith('/apps')) return 'Softwares';
    if (pathname?.startsWith('/pricing')) return 'Pricings';
    if (pathname?.startsWith('/tutorials')) return 'Tutorials';
    return '';
  }, [pathname]);

  useEffect(() => {
    const updateNav = () => {
      const activeEl = navTabRefs.current[activeTabName];
      if (activeEl) {
        setNavIndicator({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
          ready: true,
        });
      } else {
        setNavIndicator((prev) => ({ ...prev, ready: false }));
      }
    };
    updateNav();
    const raf = requestAnimationFrame(updateNav);
    window.addEventListener('resize', updateNav);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateNav);
    };
  }, [activeTabName]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md text-neutral-900 dark:text-white select-none transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
          {/* Left: Small Text Tabs (Home, Softwares, Pricings, Tutorials) */}
          <div className="relative flex items-center gap-1 sm:gap-2 no-scrollbar py-1">
            {navIndicator.ready && (
              <div
                className="absolute rounded-full bg-neutral-100 dark:bg-neutral-900 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                style={{
                  left: `${navIndicator.left}px`,
                  width: `${navIndicator.width}px`,
                  top: `${navIndicator.top}px`,
                  height: `${navIndicator.height}px`,
                }}
              />
            )}
            {NAV_TABS.map((tab) => {
              const isActive = tab.name === activeTabName;

              return (
                <Link
                  key={tab.name}
                  ref={(el) => { navTabRefs.current[tab.name] = el; }}
                  href={tab.href}
                  className={`relative z-10 px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'font-medium text-neutral-950 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/40 dark:hover:bg-neutral-900/40'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>

          {/* Right: Theme Mode Toggle & Account Icon */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Sleek Switch Mode Toggle Button (Icon switch only, no text) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 border border-neutral-200 dark:border-neutral-800 transition-colors duration-200 ease-in-out cursor-pointer shadow-sm active:scale-95 ${
                theme === 'dark' ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-200/90 hover:bg-neutral-300/80'
              }`}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="sr-only">Toggle theme</span>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-neutral-950 shadow-sm transform transition-transform duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-5 text-neutral-200' : 'translate-x-0 text-neutral-800'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <Sun className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {/* Dashboard shortcut (shown when user is confirmed or session is expected, only after client hydration) */}
            {mounted && (user || (loading && hasSessionHint)) && (
              <Link
                href="/dashboard"
                className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border transition-colors shadow-sm active:scale-[0.98] ${
                  pathname === '/dashboard'
                    ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-900/90 hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80 text-xs font-medium text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            )}

            {/* Profile Avatar / Loading Skeleton / Sign In Button */}
            {!mounted ? (
              <div className="w-9 h-9" />
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-800 hover:border-neutral-500 dark:hover:border-neutral-500 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 overflow-hidden shadow-sm"
                  aria-label="Account Menu"
                  title={profile?.displayName || user.email || 'My Account'}
                >
                  <UserAvatar
                    user={user}
                    profile={profile}
                    size="sm"
                    className="w-full h-full"
                  />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-xl py-1.5 shadow-2xl z-50 text-neutral-800 dark:text-neutral-200 backdrop-blur-xl"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 bg-neutral-50/80 dark:bg-neutral-900/60 rounded-t-xl flex items-center gap-3">
                      <UserAvatar user={user} profile={profile} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-950 dark:text-white truncate font-sans">
                          {profile?.displayName || user.displayName || 'DocStudio User'}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono flex items-center gap-1">
                          <span>@{profile?.username || user.email?.split('@')[0] || 'creator'}</span>
                          <VerifiedBadge size="sm" />
                        </p>
                      </div>
                    </div>

                    {/* Monthly Credits Left Status Card */}
                    <div className="mx-2 my-2 p-2.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-sans">
                        <span className="font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-neutral-800 dark:text-white" />
                          Monthly Credits Left
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white font-sans text-xs tabular-nums">
                          {totalCreditsRemaining.toLocaleString()}{' '}
                          <span className="font-normal text-[11px] text-neutral-500 dark:text-neutral-400">credits</span>
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(6, creditsPercentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-0.5 text-[10px] font-sans">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {activePlanName}
                        </span>
                        <Link
                          href="/pricing"
                          onClick={() => setUserDropdownOpen(false)}
                          className="font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
                        >
                          <span>Top Up</span>
                          <Sparkles className="w-2.5 h-2.5 text-neutral-800 dark:text-white" />
                        </Link>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      Dashboard
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      Settings
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                        Admin Portal
                      </Link>
                    )}

                    <div className="border-t border-neutral-200 dark:border-neutral-900 my-1" />

                    <button
                      type="button"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : loading && hasSessionHint ? (
              <div className="w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ) : (
              <Link href="/sign-in" title="Sign In">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-900/90 hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-black text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
