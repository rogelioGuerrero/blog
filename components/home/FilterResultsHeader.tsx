import React from 'react';

interface FilterResultsHeaderProps {
  searchQuery: string;
  activeCategory: string;
  resultCount: number;
}

export function FilterResultsHeader({ searchQuery, activeCategory, resultCount }: FilterResultsHeaderProps) {
  return (
    <div className="mb-8 pb-4 border-b border-slate-200 dark:border-white/10">
      <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
        {searchQuery ? `Searching for "${searchQuery}"` : `${activeCategory} Stories`}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mt-1">
        Found {resultCount} articles
      </p>
    </div>
  );
}
