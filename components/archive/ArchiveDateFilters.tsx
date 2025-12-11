import React from 'react';

type ArchiveDateFilter = 'all' | 'last30' | 'last365';

interface ArchiveDateFiltersProps {
  currentFilter: ArchiveDateFilter;
  onFilterChange: (filter: ArchiveDateFilter) => void;
}

const filters: { value: ArchiveDateFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last365', label: 'Last year' },
];

export function ArchiveDateFilters({ currentFilter, onFilterChange }: ArchiveDateFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
      <span className="font-semibold uppercase tracking-widest">Date range:</span>
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onFilterChange(value)}
          className={`px-3 py-1 rounded-full border transition-colors ${
            currentFilter === value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
