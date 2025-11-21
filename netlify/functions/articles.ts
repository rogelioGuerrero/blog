import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NETLIFY_DATABASE_URL;

if (!connectionString) {
  console.warn('NETLIFY_DATABASE_URL is not set. Articles function will fail until this is configured.');
}

const sql = connectionString ? neon(connectionString) : null;

interface ArticleRow {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  media: any | null;
  audio_url: string | null;
  category: string;
  date: string;
  author: string;
  featured: boolean | null;
  read_time: number | null;
  sources: any | null;
  views: number | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const mapRowToArticle = (row: ArticleRow) => ({
  id: row.id,
  title: row.title,
  excerpt: row.excerpt,
  content: row.content,
  media: row.media ?? [],
  audioUrl: row.audio_url ?? undefined,
  category: row.category,
  date: row.date,
  author: row.author,
  featured: row.featured ?? false,
  readTime: row.read_time ?? 5,
  sources: row.sources ?? [],
  views: row.views ?? 0,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (!sql) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Database not configured' }),
    };
  }

  const { httpMethod, queryStringParameters, body } = event;

  try {
    // GET /articles or /articles?id=...
    if (httpMethod === 'GET') {
      const id = queryStringParameters?.id;

      if (id) {
        const rows = await sql`SELECT id, title, excerpt, content, media, audio_url, category, date, author, featured, read_time, sources, views FROM articles WHERE id = ${id} LIMIT 1`;
        const typed = rows as unknown as ArticleRow[];

        if (!typed.length) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Article not found' }),
          };
        }

        const article = mapRowToArticle(typed[0]);
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ article }),
        };
      }

      const rows = await sql`SELECT id, title, excerpt, content, media, audio_url, category, date, author, featured, read_time, sources, views FROM articles ORDER BY created_at DESC`;
      const articles = (rows as unknown as ArticleRow[]).map(mapRowToArticle);

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articles }),
      };
    }

    // POST /articles  (upsert)
    if (httpMethod === 'POST') {
      if (!body) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing request body' }),
        };
      }

      let payload: any;
      try {
        payload = JSON.parse(body);
      } catch {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid JSON body' }),
        };
      }

      const article = payload;

      if (!article || !article.id || !article.title || !article.excerpt || !article.content) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required article fields' }),
        };
      }

      const rows = await sql`INSERT INTO articles (
          id,
          title,
          excerpt,
          content,
          media,
          audio_url,
          category,
          date,
          author,
          featured,
          read_time,
          sources,
          views
        ) VALUES (
          ${article.id},
          ${article.title},
          ${article.excerpt},
          ${article.content},
          ${article.media ?? []},
          ${article.audioUrl ?? null},
          ${article.category},
          ${article.date},
          ${article.author},
          ${article.featured ?? false},
          ${article.readTime ?? 5},
          ${article.sources ?? []},
          ${article.views ?? 0}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          media = EXCLUDED.media,
          audio_url = EXCLUDED.audio_url,
          category = EXCLUDED.category,
          date = EXCLUDED.date,
          author = EXCLUDED.author,
          featured = EXCLUDED.featured,
          read_time = EXCLUDED.read_time,
          sources = EXCLUDED.sources,
          views = EXCLUDED.views,
          updated_at = now()
        RETURNING id, title, excerpt, content, media, audio_url, category, date, author, featured, read_time, sources, views`;

      const typed = rows as unknown as ArticleRow[];
      const saved = mapRowToArticle(typed[0]);

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article: saved }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error handling articles request', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
