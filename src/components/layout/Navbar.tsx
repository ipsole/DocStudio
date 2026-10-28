'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { renderUserIcon } from '@/components/ui/AvatarIconPicker';
import {
  LogOut,
  LayoutDashboard,
  Settings,
  Shield,
  User as UserIcon,
  Sun,
  Moon,
} from 'lucide-react';

const NAV_TABS = [
  { name: 'Home', href: '/' },
  { name: 'Softwares', href: '/#softwares' },
  { name: 'Pricings', href: '/#pricings' },
  { name: 'Tutorials', href: '/#tutorials' },
];

export function Navbar() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  React.useEffect(() => {
    const updateHash = () => {
      if (typeof window !== 'undefined') {
        setHash(window.location.hash.toLowerCase());
      }
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md text-neutral-900 dark:text-white select-none transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
          {/* Left: Small Text Tabs (Home, Softwares, Pricings, Tutorials) */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
            {NAV_TABS.map((tab) => {
              const isActive =
                tab.name === 'Home'
                  ? pathname === '/' && (!hash || hash === '#home')
                  : tab.name === 'Softwares'
                  ? hash === '#softwares' || pathname?.startsWith('/apps')
                  : tab.name === 'Pricings'
                  ? hash === '#pricings' || pathname?.startsWith('/pricing')
                  : hash === '#tutorials' || pathname?.startsWith('/tutorials');

              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'font-medium text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-900/60'
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

            {user && (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-900/90 hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all shadow-sm active:scale-[0.98]"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Dashboard</span>
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-800 hover:border-neutral-500 dark:hover:border-neutral-500 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center text-neutral-900 dark:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                  aria-label="Account Menu"
                  title={profile?.displayName || user.email || 'My Account'}
                >
                  {profile?.avatarIcon ? (
                    renderUserIcon(profile.avatarIcon, 'w-4 h-4 text-neutral-900 dark:text-white')
                  ) : (
                    <span className="font-sans text-xs font-semibold">
                      {profile?.displayName
                        ? profile.displayName.charAt(0).toUpperCase()
                        : user.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-xl py-1.5 shadow-2xl z-50 text-neutral-800 dark:text-neutral-200 backdrop-blur-xl"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 bg-neutral-50/80 dark:bg-neutral-900/60 rounded-t-xl">
                      <p className="text-[11px] font-sans font-medium text-neutral-500 dark:text-neutral-400">
                        Active Account
                      </p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5 font-sans">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      Dashboard & Subscriptions
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      Account & Avatar
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
