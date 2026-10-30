import React from 'react';
import { Search } from 'lucide-react';
import { CATEGORIES } from '@/lib/seedData';

interface AppFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}

export function AppFilter({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalCount,
}: AppFilterProps) {
  return (
    <div className="space-y-4 mb-8">
      {/* Search Input and Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="SEARCH PRODUCTS, CAPABILITIES..."
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 text-xs sm:text-sm font-sans tracking-wide text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 placeholder:font-mono placeholder:text-xs placeholder:uppercase focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors rounded-lg"
          />
        </div>
        <div className="font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 self-end sm:self-center">
          CATALOG: <span className="font-bold text-neutral-950 dark:text-white">{totalCount}</span> AVAILABLE
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer rounded-full ${
                isSelected
                  ? 'border border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-black font-semibold shadow-sm'
                  : 'border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-500 dark:hover:border-neutral-600 hover:text-black dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
