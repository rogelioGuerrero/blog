export type NewsApiLanguage = 'es' | 'en' | 'fr' | 'pt' | 'de';
export type NewsApiTimeFrame = '24h' | '48h' | 'week' | 'month' | 'any';
export type NewsApiRegion = 'world' | 'us' | 'eu' | 'latam' | 'asia';

export interface NewsApiArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  source: { name: string };
  publishedAt: string;
}

export interface NewsApiSearchResponse {
  endpointUsed: 'everything' | 'top-headlines' | null;
  request: Record<string, unknown>;
  totalResults: number;
  articles: NewsApiArticle[];
  warning?: string;
  debug?: Record<string, unknown>;
}

const API_BASE = '/.netlify/functions';
const STORAGE_KEY = 'blog_generator_config';

const loadNewsApiKeyFromStorage = (): string | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const key = typeof parsed?.newsApiKey === 'string' ? parsed.newsApiKey.trim() : '';
    return key || null;
  } catch {
    return null;
  }
};

export const searchNewsApiRaw = async (params: {
  query: string;
  language?: NewsApiLanguage;
  timeFrame?: NewsApiTimeFrame;
  sourceRegion?: NewsApiRegion;
  pageSize?: number;
  newsApiKey?: string;
}): Promise<NewsApiSearchResponse> => {
  const resolvedKey = (params.newsApiKey || loadNewsApiKeyFromStorage() || '').trim();

  const response = await fetch(`${API_BASE}/news-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: params.query,
      language: params.language || 'es',
      timeFrame: params.timeFrame || 'any',
      sourceRegion: params.sourceRegion || 'world',
      pageSize: params.pageSize ?? 5,
      newsApiKey: resolvedKey || undefined,
    }),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as NewsApiSearchResponse;
  } catch {
    throw new Error('Invalid JSON response from news-search');
  }
};
