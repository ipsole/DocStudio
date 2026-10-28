'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md text-neutral-900 dark:text-white select-none transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-end">
          {/* Right: Theme Mode Toggle & Account Icon */}
          <div className="flex items-center gap-3">
            {/* Pill Switch Mode Toggle Button matching design */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-900/90 hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm font-medium tracking-tight">
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-neutral-300" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-neutral-700" />
                )}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>

              {/* Slider Track with Knob containing Sun/Moon */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  theme === 'dark' ? 'bg-neutral-700' : 'bg-[#d4d7dc]'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon className="w-3 h-3 text-neutral-900" />
                  ) : (
                    <Sun className="w-3 h-3 text-neutral-600" />
                  )}
                </div>
              </div>
            </button>

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
                    <span className="font-mono text-xs font-bold">
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
                      <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Active Account
                      </p>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate mt-0.5 font-mono">
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
                  className="w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-white bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <UserIcon className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
