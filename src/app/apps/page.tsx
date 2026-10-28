'use client';

import React, { useState, useEffect } from 'react';
import { getPublicApps } from '@/lib/firebase/db';
import { DocApp } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { AppFilter } from '@/components/apps/AppFilter';
import { Inbox } from 'lucide-react';

export default function AppsCatalogPage() {
  const [apps, setApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const data = await getPublicApps();
        setApps(data);
      } catch (err) {
        console.error('Failed to load apps:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-950 pb-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
          OFFICIAL DIRECTORY
        </div>
        <h1 className="text-3xl sm:text-5xl font-light tracking-[-0.03em] uppercase text-neutral-950 font-sans">
          Software Catalog
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-600 max-w-2xl font-sans">
          Explore all active software tools and upcoming products built under the Docdril
          umbrella. Accessible with your unified DocStore central account.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <AppFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={filteredApps.length}
      />

      {/* Catalog Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 border border-neutral-200 bg-white p-6 animate-pulse space-y-4 rounded-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neutral-200 rounded-none" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-neutral-200 w-1/2" />
                  <div className="h-3 bg-neutral-100 w-1/3" />
                </div>
              </div>
              <div className="h-14 bg-neutral-100" />
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
          <div className="w-12 h-12 border border-neutral-950 text-neutral-950 mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-neutral-950">
            No software found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 font-sans">
            {searchQuery || selectedCategory !== 'all'
              ? 'No applications match your filter criteria.'
              : 'Software applications will appear here as they are published.'}
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
    </div>
  );
}
