import { useState, useEffect } from 'react';
import { Article, AppSettings } from '../types';
import { getArticlesFromApi, getSettingsFromApi, incrementArticleViewApi } from '../services/api';
import { DEFAULT_APP_SETTINGS } from '../services/data';

interface UseArticlesReturn {
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isBootstrapping: boolean;
  dataVersion: number;
  setDataVersion: React.Dispatch<React.SetStateAction<number>>;
  featuredArticle: Article | undefined;
  incrementView: (id: string) => Promise<void>;
}

export function useArticles(): UseArticlesReturn {
  const [articles, setArticles] = useState<Article[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [remoteSettings, remoteArticles] = await Promise.all([
          getSettingsFromApi(),
          getArticlesFromApi(),
        ]);

        if (cancelled) return;

        setSettings(remoteSettings);
        setArticles(remoteArticles);
      } catch (e) {
        console.error('Failed to bootstrap data from API', e);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredArticle = articles.find(a => a.featured) || articles[0];

  const incrementView = async (id: string) => {
    try {
      const updated = await incrementArticleViewApi(id);
      setArticles(prev => {
        const index = prev.findIndex(a => a.id === updated.id);
        if (index === -1) return prev;
        const copy = [...prev];
        copy[index] = updated;
        return copy;
      });
    } catch (e) {
      console.error('Failed to increment article view', e);
    }
  };

  return {
    articles,
    setArticles,
    settings,
    setSettings,
    isBootstrapping,
    dataVersion,
    setDataVersion,
    featuredArticle,
    incrementView,
  };
}
