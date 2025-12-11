import React from 'react';
import { Article } from '../../types';
import { SearchX } from 'lucide-react';
import { ArchiveCard } from './ArchiveCard';
import { ArchivePagination } from './ArchivePagination';
import { ArchiveDateFilters } from './ArchiveDateFilters';

type ArchiveDateFilter = 'all' | 'last30' | 'last365';

interface ArchiveViewProps {
  articles: Article[];
  pageItems: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  dateFilter: ArchiveDateFilter;
  onDateFilterChange: (filter: ArchiveDateFilter) => void;
  onPageChange: (page: number) => void;
  onArticleClick: (id: string) => void;
}

export function ArchiveView({
  articles,
  pageItems,
  totalCount,
  currentPage,
  totalPages,
  dateFilter,
  onDateFilterChange,
  onPageChange,
  onArticleClick,
}: ArchiveViewProps) {
  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <header className="mb-8 pb-4 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-1">Archive</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Browse all published stories. Use the top navigation and search to filter by category and keywords.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
          {totalCount} articles
        </div>
      </header>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-70">
          <SearchX size={48} className="text-slate-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No stories in archive</h3>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
            Try changing the category or clearing the search box to see more results.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
            <ArchiveDateFilters
              currentFilter={dateFilter}
              onFilterChange={onDateFilterChange}
            />
            {totalPages > 1 && (
              <ArchivePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map(article => (
              <ArchiveCard
                key={article.id}
                article={article}
                onClick={() => onArticleClick(article.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center">
              <ArchivePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
