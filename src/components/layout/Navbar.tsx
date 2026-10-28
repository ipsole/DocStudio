'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Settings,
  Shield,
  ArrowRight,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-18 items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group select-none">
              <DocdrilLogo size={30} />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-light tracking-[-0.03em] font-sans uppercase leading-none text-neutral-950">
                    DocStore
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 uppercase border border-neutral-300 px-1 py-0.2 leading-none">
                    BETA
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mt-0.5">
                  BY DOCDRIL
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/apps"
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium uppercase tracking-[-0.02em] font-sans transition-colors ${
                  isActive('/apps')
                    ? 'text-neutral-950 font-bold border-b-2 border-neutral-950'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                Explore Apps
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium uppercase tracking-[-0.02em] font-sans transition-colors ${
                    isActive('/dashboard')
                      ? 'text-neutral-950 font-bold border-b-2 border-neutral-950'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium uppercase tracking-[-0.02em] font-sans transition-colors flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'text-neutral-950 font-bold border-b-2 border-neutral-950'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 border border-neutral-950 bg-white hover:bg-neutral-50 transition-all cursor-pointer rounded-none"
                >
                  <div className="w-6 h-6 bg-neutral-950 text-white flex items-center justify-center text-xs font-semibold">
                    {profile?.displayName
                      ? profile.displayName.charAt(0).toUpperCase()
                      : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-neutral-900 max-w-[140px] truncate tracking-tight">
                    {profile?.displayName || user.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 border border-neutral-950 bg-white py-1.5 shadow-2xl z-50 rounded-none"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                      <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-xs font-semibold text-neutral-950 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100 hover:text-black transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500" />
                      Dashboard
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100 hover:text-black transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-500" />
                      Account Settings
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-neutral-950 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-neutral-700" />
                        Admin Portal
                      </Link>
                    )}

                    <div className="border-t border-neutral-100 my-1" />

                    <button
                      type="button"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="secondary" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-neutral-950 text-neutral-950 hover:bg-neutral-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-950 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/apps"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold uppercase tracking-wider text-neutral-900 border-b border-neutral-100"
          >
            Explore Apps
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold uppercase tracking-wider text-neutral-900 border-b border-neutral-100"
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold uppercase tracking-wider text-neutral-900 border-b border-neutral-100"
              >
                Account Settings
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-semibold uppercase tracking-wider text-neutral-950 border-b border-neutral-100"
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
                  className="w-full text-left py-2 text-sm font-semibold uppercase tracking-wider text-red-600"
                >
                  Sign Out ({user.email})
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
