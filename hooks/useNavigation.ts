import { useState, useEffect, useRef, useCallback } from 'react';
import { ViewState, Article } from '../types';

interface UseNavigationProps {
  articles: Article[];
  onIncrementView: (id: string) => Promise<void>;
  setDataVersion: React.Dispatch<React.SetStateAction<number>>;
}

interface UseNavigationReturn {
  view: ViewState;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  selectedArticleId: string | null;
  setSelectedArticleId: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  handleArticleClick: (id: string) => void;
  handleHomeClick: () => void;
  handleArchiveClick: () => void;
  handleDeepLink: (articleId: string, articles: Article[]) => void;
}

export function useNavigation({
  articles,
  onIncrementView,
  setDataVersion,
}: UseNavigationProps): UseNavigationReturn {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  // Handle Browser Back/Forward Buttons
  useEffect(() => {
    const handlePopState = () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      setIsLoading(false);

      const params = new URLSearchParams(window.location.search);
      const sharedArticleId = params.get('articleId');

      if (!sharedArticleId && view === 'ARTICLE') {
        setView('HOME');
        setSelectedArticleId(null);
      } else if (sharedArticleId && sharedArticleId !== selectedArticleId) {
        const exists = articles.find(a => a.id === sharedArticleId);
        if (exists) {
          setSelectedArticleId(sharedArticleId);
          setView('ARTICLE');
        } else {
          setView('HOME');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, selectedArticleId, articles]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedArticleId]);

  const handleArticleClick = useCallback((id: string) => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    setIsLoading(true);
    window.scrollTo(0, 0);

    try {
      const newUrl = `${window.location.pathname}?articleId=${id}`;
      window.history.pushState({ articleId: id }, '', newUrl);
    } catch (e) {
      console.warn("Deep linking disabled: History API unavailable in this environment.");
    }

    transitionTimeoutRef.current = window.setTimeout(async () => {
      await onIncrementView(id);
      setSelectedArticleId(id);
      setView('ARTICLE');
      setIsLoading(false);
    }, 600);
  }, [onIncrementView]);

  const handleHomeClick = useCallback(() => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    if (view === 'HOME') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    window.scrollTo(0, 0);

    try {
      window.history.pushState({}, '', window.location.pathname);
    } catch (e) {
      console.warn("Deep linking disabled: History API unavailable in this environment.");
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      setView('HOME');
      setDataVersion(v => v + 1);
      setIsLoading(false);
    }, 500);
  }, [view, setDataVersion]);

  const handleArchiveClick = useCallback(() => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    setIsLoading(false);
    setView('ARCHIVE');
    window.scrollTo(0, 0);
  }, []);

  const handleDeepLink = useCallback(async (articleId: string, articleList: Article[]) => {
    const exists = articleList.find(a => a.id === articleId);
    if (exists) {
      await onIncrementView(articleId);
      setSelectedArticleId(articleId);
      setView('ARTICLE');
    }
  }, [onIncrementView]);

  return {
    view,
    setView,
    selectedArticleId,
    setSelectedArticleId,
    isLoading,
    handleArticleClick,
    handleHomeClick,
    handleArchiveClick,
    handleDeepLink,
  };
}
