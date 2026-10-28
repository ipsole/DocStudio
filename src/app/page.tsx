'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPublicApps } from '@/lib/firebase/db';
import { DocApp } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { AppFilter } from '@/components/apps/AppFilter';
import { Button } from '@/components/ui/Button';
import {
  Boxes,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Inbox,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const [apps, setApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      try {
        const fetched = await getPublicApps();
        setApps(fetched);
      } catch (err) {
        console.error('Failed to load apps:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const filteredApps = apps.filter((app) => {
    const matchesCategory =
      selectedCategory === 'all' || app.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.tags && app.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-12 bg-gradient-to-b from-white via-slate-50/50 to-transparent border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-50/80 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Docdril Software Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              One Central Platform. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                All Docdril Software.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              DocStore is the central launchpad to discover, access, and manage applications
              built by Docdril. Experience independent software tools connected through one
              unified account.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/apps">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-sm">
                  Explore Software Catalog
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">One Unified Identity</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Sign in once with your Docdril central account to navigate smoothly between all current
              and future software products.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Independent Applications</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Each application is engineered for focus and performance, yet integrated into
              a shared discovery catalog and data infrastructure.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Secure Architecture</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Built on Google Firebase with strictly enforced Firestore security rules, token
              validation, and protected server-side boundaries.
            </p>
          </div>
        </div>
      </section>

      {/* Software Discovery / Catalog Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Software Catalog</h2>
              <p className="text-sm text-slate-500 mt-1">
                Browse available software applications and upcoming tools under development.
              </p>
            </div>
            <Link href="/apps" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all applications →
            </Link>
          </div>

          {/* Filter & Search */}
          <AppFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalCount={filteredApps.length}
          />

          {/* App Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-12 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 bg-white">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No applications found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No software matches your current search criteria. Try resetting filters.'
                  : 'Products will appear here as they are published to the catalog.'}
              </p>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Ecosystem Philosophy Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400">
              Architecture & Vision
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Built to grow alongside the Docdril ecosystem
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              DocStore is deliberately structured to support independently deployed software—from
              creative utilities to document workflow engines. As new products launch, they link into
              this central platform without rebuilding account or security infrastructure.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-blue-400" />
                Data-driven catalog
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-400" />
                Role-based access ready
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
