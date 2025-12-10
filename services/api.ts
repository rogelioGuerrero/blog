import { Article, AppSettings } from '../types';
import { normalizeArticle, SEED_ARTICLES, DEFAULT_APP_SETTINGS } from './data';

const API_BASE = '/.netlify/functions';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init && init.headers ? init.headers : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

let articlesCache: Article[] | null = null;
let settingsCache: AppSettings | null = null;

export async function getArticlesFromApi(): Promise<Article[]> {
  if (articlesCache) return articlesCache;

  if (typeof window === 'undefined') {
    return SEED_ARTICLES;
  }

  try {
    const data = await fetchJson<{ articles: any[] }>('/articles');
    const raw = Array.isArray(data.articles) ? data.articles : [];
    const normalized = raw.map(normalizeArticle);
    articlesCache = normalized;
    return normalized;
  } catch (error) {
    console.error('Failed to load articles from API', error);
    articlesCache = [];
    return [];
  }
}

export async function getArticleFromApi(id: string): Promise<Article | null> {
  if (typeof window === 'undefined') {
    const fromSeed = SEED_ARTICLES.find(a => a.id === id) || null;
    return fromSeed;
  }

  try {
    const data = await fetchJson<{ article: any }>(`/articles?id=${encodeURIComponent(id)}`);
    return normalizeArticle(data.article);
  } catch (error) {
    console.error('Failed to load article from API', error);
    return null;
  }
}

export async function saveArticleToApi(article: Article): Promise<Article> {
  if (typeof window === 'undefined') {
    return article;
  }

  const data = await fetchJson<{ article: any }>('/articles', {
    method: 'POST',
    body: JSON.stringify(article),
  });

  const saved = normalizeArticle(data.article);

  if (articlesCache) {
    const index = articlesCache.findIndex(a => a.id === saved.id);
    if (index > -1) {
      const copy = [...articlesCache];
      copy[index] = saved;
      articlesCache = copy;
    } else {
      articlesCache = [saved, ...articlesCache];
    }
  }

  return saved;
}

export async function deleteArticleFromApi(id: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const url = `${API_BASE}/articles-delete?id=${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to delete article: ${response.status} ${text}`);
  }

  if (articlesCache) {
    articlesCache = articlesCache.filter(a => a.id !== id);
  }
}

export async function incrementArticleViewApi(id: string): Promise<Article> {
  if (typeof window === 'undefined') {
    const fromSeed = SEED_ARTICLES.find(a => a.id === id);
    return fromSeed ?? normalizeArticle({ id });
  }

  const data = await fetchJson<{ article: any }>(`/article-view?id=${encodeURIComponent(id)}`, {
    method: 'POST',
  });

  const updated = normalizeArticle(data.article);

  if (articlesCache) {
    const index = articlesCache.findIndex(a => a.id === updated.id);
    if (index > -1) {
      const copy = [...articlesCache];
      copy[index] = updated;
      articlesCache = copy;
    }
  }

  return updated;
}

export async function getSettingsFromApi(): Promise<AppSettings> {
  if (settingsCache) return settingsCache;

  if (typeof window === 'undefined') {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const data = await fetchJson<{ settings: any }>('/settings');
    const raw = data.settings || {};
    const merged: AppSettings = {
      ...DEFAULT_APP_SETTINGS,
      ...raw,
      footerLinks: Array.isArray(raw.footerLinks) ? raw.footerLinks : [],
      logoUrl: raw.logoUrl || DEFAULT_APP_SETTINGS.logoUrl,
      homeLayout: raw.homeLayout || DEFAULT_APP_SETTINGS.homeLayout || 'hero_masonry',
    };
    settingsCache = merged;
    return merged;
  } catch (error) {
    console.error('Failed to load settings from API, using defaults instead', error);
    settingsCache = DEFAULT_APP_SETTINGS;
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveSettingsToApi(settings: AppSettings): Promise<AppSettings> {
  if (typeof window === 'undefined') {
    return settings;
  }

  const data = await fetchJson<{ settings: any }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });

  const raw = data.settings || {};
  const merged: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
    ...raw,
    footerLinks: Array.isArray(raw.footerLinks) ? raw.footerLinks : [],
    logoUrl: raw.logoUrl || DEFAULT_APP_SETTINGS.logoUrl,
    homeLayout: raw.homeLayout || DEFAULT_APP_SETTINGS.homeLayout || 'hero_masonry',
  };

  settingsCache = merged;
  return merged;
}

export async function renameCategoryInApi(oldName: string, newName: string): Promise<AppSettings> {
  if (typeof window === 'undefined') {
    const updated: AppSettings = {
      ...DEFAULT_APP_SETTINGS,
      navCategories: DEFAULT_APP_SETTINGS.navCategories.map(c => (c === oldName ? newName : c)),
      contactEmail: DEFAULT_APP_SETTINGS.contactEmail,
      footerDescription: DEFAULT_APP_SETTINGS.footerDescription,
      footerLinks: DEFAULT_APP_SETTINGS.footerLinks,
      logoUrl: DEFAULT_APP_SETTINGS.logoUrl,
      siteName: DEFAULT_APP_SETTINGS.siteName,
    };
    return updated;
  }

  const data = await fetchJson<{ settings: any }>('/categories', {
    method: 'PUT',
    body: JSON.stringify({ oldName, newName }),
  });

  const raw = data.settings || {};
  const merged: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
    ...raw,
    footerLinks: Array.isArray(raw.footerLinks) ? raw.footerLinks : [],
    logoUrl: raw.logoUrl || DEFAULT_APP_SETTINGS.logoUrl,
  };

  settingsCache = merged;
  return merged;
}
