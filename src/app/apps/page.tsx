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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Software Catalog</h1>
        <p className="mt-2 text-base text-slate-600 max-w-3xl">
          Discover all active applications and preview upcoming software products developed by
          Docdril. Accessible with your unified DocStore account.
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
              className="h-64 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-14 bg-slate-100 rounded" />
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
        <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No software found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
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
              className="mt-4 text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
