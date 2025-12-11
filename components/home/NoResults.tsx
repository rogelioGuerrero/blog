import React from 'react';
import { SearchX } from 'lucide-react';

interface NoResultsProps {
  onClearFilters: () => void;
}

export function NoResults({ onClearFilters }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-70">
      <SearchX size={48} className="text-slate-400 mb-4" />
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No stories found</h3>
      <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or category filter.</p>
      <button
        onClick={onClearFilters}
        className="mt-6 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
      >
        Clear Filters
      </button>
    </div>
  );
}
