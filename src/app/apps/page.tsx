'use client';

import React, { useState, useEffect } from 'react';
import { getPublicApps } from '@/lib/firebase/db';
import { DocApp } from '@/types';
import { AppCard } from '@/components/apps/AppCard';
import { Search, Inbox } from 'lucide-react';
import { CATEGORIES } from '@/lib/seedData';

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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16 space-y-8">
      {/* Centered Clean Header */}
      <div className="max-w-3xl mx-auto text-center space-y-2.5">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-950 dark:text-white font-sans">
          Software, Tools & Plugins
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-sans max-w-2xl mx-auto leading-relaxed">
          Discover and launch active and upcoming applications, creative tools, and plugins across Docdril.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 text-xs font-semibold tracking-tight transition-all rounded-full cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'border border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-black font-semibold shadow-sm'
                : 'border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-black dark:hover:text-white'
            }`}
          >
            All Softwares
          </button>

          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 text-xs font-medium tracking-tight transition-all rounded-full cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'border border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-black font-semibold shadow-sm'
                    : 'border border-transparent text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search software..."
              className="w-full pl-9 pr-3 py-1.5 border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-full focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
            />
          </div>
          <span className="font-sans text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-[16/10] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80 rounded-xl">
          <div className="w-10 h-10 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 rounded-full mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-neutral-950 dark:text-white">No applications found</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto mt-1">
            {searchQuery || selectedCategory !== 'all'
              ? 'No software matches your current filters.'
              : 'Software will appear here once added to Firestore.'}
          </p>
        </div>
      )}
    </div>
  );
}
