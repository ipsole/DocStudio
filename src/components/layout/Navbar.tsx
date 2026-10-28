'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { renderUserIcon } from '@/components/ui/AvatarIconPicker';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Settings,
  Shield,
  User as UserIcon,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-black/90 backdrop-blur-md text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group select-none">
              <DocdrilLogo size={28} className="text-white" />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                    DocStudio
                  </span>
                  <span className="text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase border border-neutral-800 px-1 py-0.2 leading-none">
                    BETA
                  </span>
                </div>
                <span className="text-[9px] font-mono tracking-widest uppercase text-neutral-500">
                  BY DOCDRIL
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1 font-mono text-xs">
              <Link
                href="/apps"
                className={`px-3 py-1.5 transition-colors uppercase tracking-wider ${
                  isActive('/apps')
                    ? 'text-white font-bold border-b border-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Softwares
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 transition-colors uppercase tracking-wider ${
                    isActive('/dashboard')
                      ? 'text-white font-bold border-b border-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 transition-colors uppercase tracking-wider flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'text-white font-bold border-b border-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Auth Controls - Account Icon Based */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 border border-neutral-800 bg-neutral-950 hover:border-neutral-600 transition-all cursor-pointer rounded-full group"
                  aria-label="Account Menu"
                >
                  <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center text-xs font-bold shrink-0 group-hover:scale-105 transition-transform">
                    {profile?.avatarIcon ? (
                      renderUserIcon(profile.avatarIcon, 'w-4 h-4 text-white')
                    ) : (
                      <span>
                        {profile?.displayName
                          ? profile.displayName.charAt(0).toUpperCase()
                          : user.email?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs font-mono tracking-tight text-neutral-300 max-w-[130px] truncate">
                    {profile?.displayName || user.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 border border-neutral-800 bg-neutral-950 py-1.5 shadow-2xl z-50 rounded-none text-neutral-200"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-neutral-900 bg-neutral-900/50">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        Signed in as
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
                      Dashboard & Credits
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-400" />
                      Account Settings
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-900/80 hover:bg-neutral-800 transition-colors"
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
              <Link href="/sign-in">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-1.5 border border-neutral-800 hover:border-white text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all rounded-full"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>LOGIN</span>
                </button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-900 bg-black px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/apps"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold tracking-tight text-neutral-200 border-b border-neutral-900"
          >
            Softwares
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold tracking-tight text-neutral-200 border-b border-neutral-900"
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold tracking-tight text-neutral-200 border-b border-neutral-900"
              >
                Account Settings
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-semibold tracking-tight text-neutral-200 border-b border-neutral-900"
                >
                  Admin Portal
                </Link>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-2 py-2 text-sm font-medium text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-xs font-mono uppercase tracking-wider bg-white text-black font-semibold rounded-none"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
