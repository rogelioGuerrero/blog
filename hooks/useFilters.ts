import { useState, useEffect, useMemo } from 'react';
import { Article } from '../types';

type ArchiveDateFilter = 'all' | 'last30' | 'last365';

interface UseFiltersProps {
  articles: Article[];
  featuredArticle: Article | undefined;
}

interface UseFiltersReturn {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  activeCategory: string;
  setActiveCategory: React.Dispatch<React.SetStateAction<string>>;
  filteredArticles: Article[];
  displayArticles: Article[];
  // Archive specific
  archiveDateFilter: ArchiveDateFilter;
  setArchiveDateFilter: React.Dispatch<React.SetStateAction<ArchiveDateFilter>>;
  archivePage: number;
  setArchivePage: React.Dispatch<React.SetStateAction<number>>;
  archiveFilteredByDate: Article[];
  archivePageItems: Article[];
  archiveTotalPages: number;
  safeArchivePage: number;
  resetFilters: () => void;
}

const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;
const MS_365_DAYS = 365 * 24 * 60 * 60 * 1000;
const ARCHIVE_PAGE_SIZE = 9;

export function useFilters({ articles, featuredArticle }: UseFiltersProps): UseFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [archiveDateFilter, setArchiveDateFilter] = useState<ArchiveDateFilter>('all');
  const [archivePage, setArchivePage] = useState(1);

  // Reset archive pagination when filters change
  useEffect(() => {
    setArchivePage(1);
  }, [searchQuery, activeCategory, archiveDateFilter]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = (
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesCategory = activeCategory === 'All' || article.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, activeCategory]);

  const displayArticles = useMemo(() => {
    if (searchQuery || activeCategory !== 'All' || !featuredArticle) {
      return filteredArticles;
    }
    return filteredArticles.filter(a => a.id !== featuredArticle.id);
  }, [filteredArticles, searchQuery, activeCategory, featuredArticle]);

  const archiveFilteredByDate = useMemo(() => {
    const now = Date.now();
    return filteredArticles.filter(article => {
      if (archiveDateFilter === 'all') return true;
      const t = new Date(article.date).getTime();
      if (isNaN(t)) return true;
      const delta = now - t;
      if (archiveDateFilter === 'last30') return delta <= MS_30_DAYS;
      if (archiveDateFilter === 'last365') return delta <= MS_365_DAYS;
      return true;
    });
  }, [filteredArticles, archiveDateFilter]);

  const archiveSorted = useMemo(() => {
    return [...archiveFilteredByDate].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
    });
  }, [archiveFilteredByDate]);

  const archiveTotalPages = Math.max(1, Math.ceil(archiveSorted.length / ARCHIVE_PAGE_SIZE));
  const safeArchivePage = Math.min(archivePage, archiveTotalPages);
  const archivePageStart = (safeArchivePage - 1) * ARCHIVE_PAGE_SIZE;
  const archivePageItems = archiveSorted.slice(archivePageStart, archivePageStart + ARCHIVE_PAGE_SIZE);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
  };

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredArticles,
    displayArticles,
    archiveDateFilter,
    setArchiveDateFilter,
    archivePage,
    setArchivePage,
    archiveFilteredByDate,
    archivePageItems,
    archiveTotalPages,
    safeArchivePage,
    resetFilters,
  };
}
