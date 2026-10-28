import React from 'react';
import Link from 'next/link';
import { DocdrilLogo } from '@/components/ui/DocdrilLogo';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <DocdrilLogo size={26} />
              <span className="font-bold text-xl tracking-tight uppercase text-neutral-950 font-sans">
                DocStudio
              </span>
              <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                BY DOCDRIL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed font-sans">
              The centralized software platform powering creative, animation, and
              productivity tools created under the Docdril ecosystem.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-neutral-950 mb-4">
              Platform
            </h4>
            <div className="flex flex-col space-y-2.5 text-xs uppercase tracking-wider font-medium text-neutral-600 font-sans">
              <Link href="/" className="hover:text-black transition-colors">
                Home
              </Link>
              <Link href="/apps" className="hover:text-black transition-colors">
                Explore Apps
              </Link>
              <Link href="/dashboard" className="hover:text-black transition-colors">
                Dashboard
              </Link>
              <Link href="/account" className="hover:text-black transition-colors">
                Account Settings
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-neutral-950 mb-4">
              Ecosystem
            </h4>
            <div className="flex flex-col space-y-2.5 text-xs uppercase tracking-wider font-medium text-neutral-600 font-sans">
              <a
                href="https://docdril.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors"
              >
                Docdril Main Site ↗
              </a>
              <span className="text-neutral-400">Docdril Creative-Tech</span>
              <span className="text-neutral-400">Single Central Account</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[11px] text-neutral-400 uppercase">
          <p>© {new Date().getFullYear()} DOCDRIL. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-4">
            <span>DOCSTUDIO PLATFORM 1.0</span>
            <span>•</span>
            <span className="text-emerald-700">FIREBASE CONNECTED</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
