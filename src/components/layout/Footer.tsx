import React from 'react';
import Link from 'next/link';
import { Boxes } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight">DocStore</span>
              <span className="text-xs text-slate-400">by Docdril</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              The central software platform and account ecosystem powering applications built by Docdril.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <Link href="/apps" className="hover:text-slate-900 transition-colors">
              Explore Apps
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/account" className="hover:text-slate-900 transition-colors">
              Account
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Docdril. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>DocStore Platform Foundation</span>
            <span>•</span>
            <span>Firebase Connected</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
