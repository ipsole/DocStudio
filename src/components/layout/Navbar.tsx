'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { useAuth } from '@/context/AuthContext';
import { renderUserIcon } from '@/components/ui/AvatarIconPicker';
import {
  LogOut,
  LayoutDashboard,
  Settings,
  Shield,
  User as UserIcon,
} from 'lucide-react';

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-black/90 backdrop-blur-md text-white select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Minimal Clean Docdril Logo Alone */}
          <Link
            href="/"
            className="flex items-center group transition-transform hover:scale-105 active:scale-95"
            title="DocStudio by Docdril"
          >
            <DocdrilLogo size={30} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
          </Link>

          {/* Center: Completely Empty & Clutter-Free */}
          <div className="flex-1" />

          {/* Right: Minimal Account Icon Based */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-9 h-9 rounded-full border border-neutral-800 hover:border-neutral-500 bg-neutral-950 flex items-center justify-center text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.06)] hover:scale-105 active:scale-95"
                  aria-label="Account Menu"
                  title={profile?.displayName || user.email || 'My Account'}
                >
                  {profile?.avatarIcon ? (
                    renderUserIcon(profile.avatarIcon, 'w-4 h-4 text-white')
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
                    className="absolute right-0 mt-2 w-64 border border-neutral-800 bg-neutral-950 py-1.5 shadow-2xl z-50 text-neutral-200 backdrop-blur-xl"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-neutral-900 bg-neutral-900/60">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        Active Account
                      </p>
                      <p className="text-xs font-semibold text-white truncate mt-0.5 font-mono">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-neutral-400" />
                      Dashboard & Subscriptions
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-400" />
                      Account & Avatar
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-neutral-300" />
                        Admin Portal
                      </Link>
                    )}

                    <div className="border-t border-neutral-900 my-1" />

                    <button
                      type="button"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-950/40 text-left transition-colors cursor-pointer"
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
                  className="w-9 h-9 rounded-full border border-neutral-800 hover:border-white bg-neutral-950 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95"
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
