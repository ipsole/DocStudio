'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPublicApps } from '@/lib/firebase/db';
import { DocApp } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { AppFilter } from '@/components/apps/AppFilter';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
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
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="border-b border-neutral-200 bg-white pt-20 sm:pt-28 pb-16 sm:pb-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 border border-neutral-950 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-neutral-950">
              <span className="w-2 h-2 bg-neutral-950" />
              <span>THE DOCDRIL SOFTWARE PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-[-0.04em] uppercase text-neutral-950 font-sans leading-[0.98]">
              ONE CENTRAL ACCOUNT. <br />
              <span className="font-extrabold">ALL DOCDRIL SOFTWARE.</span>
            </h1>

            <p className="text-base sm:text-xl text-neutral-600 max-w-2xl font-sans leading-relaxed">
              DocStore is the central launchpad for discovering, accessing, and orchestrating
              independent software applications developed under the Docdril ecosystem.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/apps">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Explore Software Catalog
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Create Central Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Architecture Pillars */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="border border-neutral-950 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-950">
          <div className="p-8 space-y-3 bg-white">
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              PILLAR 01
            </div>
            <h3 className="text-xl font-bold uppercase tracking-[-0.02em] text-neutral-950 font-sans">
              Centralized Identity
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed">
              Sign in once with your Docdril central account to seamlessly access all current
              tools and future software releases without duplicate credentials.
            </p>
          </div>

          <div className="p-8 space-y-3 bg-white">
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              PILLAR 02
            </div>
            <h3 className="text-xl font-bold uppercase tracking-[-0.02em] text-neutral-950 font-sans">
              Independent Tools
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed">
              Each software product is independently engineered and deployed for peak performance,
              unified under a shared discovery and access layer.
            </p>
          </div>

          <div className="p-8 space-y-3 bg-white">
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
              PILLAR 03
            </div>
            <h3 className="text-xl font-bold uppercase tracking-[-0.02em] text-neutral-950 font-sans">
              Secure Infrastructure
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 font-sans leading-relaxed">
              Backed by Google Cloud Firestore and Firebase Authentication with strictly enforced
              least-privilege security rules and protected server boundaries.
            </p>
          </div>
        </div>
      </section>

      {/* Software Discovery / Catalog */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-neutral-950 pb-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
              DATA-DRIVEN CATALOG
            </div>
            <h2 className="text-3xl font-light tracking-[-0.03em] uppercase text-neutral-950 font-sans">
              Software Directory
            </h2>
          </div>
          <Link
            href="/apps"
            className="font-mono text-xs uppercase tracking-wider font-semibold text-neutral-950 hover:underline inline-flex items-center gap-1"
          >
            Browse Full Directory →
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
                className="h-64 border border-neutral-200 bg-white p-6 animate-pulse space-y-4 rounded-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-200 rounded-none" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-neutral-200 w-1/2" />
                    <div className="h-3 bg-neutral-100 w-1/4" />
                  </div>
                </div>
                <div className="h-12 bg-neutral-100" />
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
          <div className="text-center py-20 px-4 border border-dashed border-neutral-300 bg-white rounded-none">
            <div className="w-12 h-12 border border-neutral-950 text-neutral-950 mx-auto flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-neutral-950">
              No matching applications
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 font-sans">
              {searchQuery || selectedCategory !== 'all'
                ? 'No software matches your current search criteria. Try resetting filters.'
                : 'Products will appear here as they are published to Firestore.'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-4 font-mono text-xs uppercase tracking-wider font-semibold text-neutral-950 underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Ecosystem Philosophy Banner */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="border border-neutral-950 bg-neutral-950 text-white p-8 sm:p-14">
          <div className="max-w-3xl space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              ARCHITECTURE & PHILOSOPHY
            </span>
            <h2 className="text-2xl sm:text-4xl font-light tracking-[-0.03em] uppercase leading-tight font-sans">
              ENGINEERED FOR EXTENSIBILITY. <br />
              BUILT FOR FUTURE EXPANSION.
            </h2>
            <p className="text-xs sm:text-base text-neutral-400 leading-relaxed font-sans">
              DocStore is built to support independently deployed software—from canvas design tools to
              document automation engines. As new products launch, they link into this central
              platform without rebuilding account or security infrastructure.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
