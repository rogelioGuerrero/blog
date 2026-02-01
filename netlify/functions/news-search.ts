import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type TimeFrame = '24h' | '48h' | 'week' | 'month' | 'any';

type GeneratorLanguage = 'es' | 'en' | 'fr' | 'pt' | 'de';

type SourceRegion = 'world' | 'us' | 'eu' | 'latam' | 'asia';

interface NewsApiSearchRequest {
  query: string;
  language?: GeneratorLanguage;
  timeFrame?: TimeFrame;
  sourceRegion?: SourceRegion;
  pageSize?: number;
  newsApiKey?: string;
}

interface NewsAPIArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  source: { name: string };
  publishedAt: string;
}

const parseBody = (body?: string | null): NewsApiSearchRequest | null => {
  if (!body) return null;
  try {
    return JSON.parse(body) as NewsApiSearchRequest;
  } catch {
    return null;
  }
};

const timeFrameToDays: Record<Exclude<TimeFrame, 'any'>, number> = {
  '24h': 1,
  '48h': 2,
  week: 7,
  month: 30,
};

const regionToCountry: Record<SourceRegion, string> = {
  world: 'us',
  us: 'us',
  eu: 'es',
  latam: 'mx',
  asia: 'jp',
};

const languageToCountry: Partial<Record<GeneratorLanguage, string>> = {
  es: 'es',
  en: 'us',
  fr: 'fr',
  pt: 'br',
  de: 'de',
};

const safePageSize = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(20, Math.floor(n)));
};

const json = (statusCode: number, payload: unknown) => ({
  statusCode,
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const payload = parseBody(event.body);
  if (!payload) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const query = (payload.query || '').trim();
  if (!query) {
    return json(400, { error: 'Missing query' });
  }

  const apiKey = (payload.newsApiKey || process.env.NEWS_API_KEY || '').trim();
  if (!apiKey) {
    return json(400, { error: 'NewsAPI key is required' });
  }

  const language: GeneratorLanguage = (payload.language || 'es') as GeneratorLanguage;
  const timeFrame: TimeFrame = (payload.timeFrame || 'any') as TimeFrame;
  const sourceRegion: SourceRegion = (payload.sourceRegion || 'world') as SourceRegion;
  const pageSize = safePageSize(payload.pageSize);

  const now = new Date();
  const daysAgo = timeFrame === 'any' ? null : timeFrameToDays[timeFrame as Exclude<TimeFrame, 'any'>];
  const fromDate = daysAgo ? new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000) : null;
  const fromISO = fromDate ? fromDate.toISOString().split('T')[0] : null;

  const country = sourceRegion === 'world'
    ? (languageToCountry[language] || 'us')
    : (regionToCountry[sourceRegion] || 'us');

  const tryFetchJson = async (url: string) => {
    const response = await fetch(url);
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    return { ok: response.ok, status: response.status, data, text };
  };

  const everythingUrl = new URL('https://newsapi.org/v2/everything');
  const everythingParams = new URLSearchParams({
    q: query,
    sortBy: 'popularity',
    language,
    pageSize: String(pageSize),
    apiKey,
  });
  if (fromISO) {
    everythingParams.set('from', fromISO);
  }
  everythingUrl.search = everythingParams.toString();

  const everythingResp = await tryFetchJson(everythingUrl.toString());

  if (everythingResp.ok && everythingResp.data?.articles?.length) {
    return json(200, {
      endpointUsed: 'everything',
      request: {
        query,
        language,
        timeFrame,
        sourceRegion,
        from: fromISO,
        pageSize,
      },
      totalResults: everythingResp.data.totalResults ?? everythingResp.data.articles.length,
      articles: (everythingResp.data.articles as NewsAPIArticle[]).slice(0, pageSize),
    });
  }

  const headlinesUrl = new URL('https://newsapi.org/v2/top-headlines');
  const headlinesParams = new URLSearchParams({
    country,
    q: query,
    pageSize: String(pageSize),
    apiKey,
  });
  headlinesUrl.search = headlinesParams.toString();

  const headlinesResp = await tryFetchJson(headlinesUrl.toString());

  if (headlinesResp.ok && headlinesResp.data?.articles?.length) {
    return json(200, {
      endpointUsed: 'top-headlines',
      request: {
        query,
        language,
        timeFrame,
        sourceRegion,
        country,
        pageSize,
      },
      totalResults: headlinesResp.data.totalResults ?? headlinesResp.data.articles.length,
      articles: (headlinesResp.data.articles as NewsAPIArticle[]).slice(0, pageSize),
    });
  }

  const error = headlinesResp.data?.message || everythingResp.data?.message || 'NewsAPI returned no results';
  const status = headlinesResp.ok ? (everythingResp.ok ? 404 : everythingResp.status) : headlinesResp.status;

  return json(200, {
    endpointUsed: null,
    request: {
      query,
      language,
      timeFrame,
      sourceRegion,
      country,
      from: fromISO,
      pageSize,
    },
    totalResults: 0,
    articles: [],
    warning: error,
    debug: {
      everything: {
        ok: everythingResp.ok,
        status: everythingResp.status,
        statusText: everythingResp.data?.status || null,
      },
      topHeadlines: {
        ok: headlinesResp.ok,
        status: headlinesResp.status,
        statusText: headlinesResp.data?.status || null,
      },
      httpStatus: status,
    },
  });
};
