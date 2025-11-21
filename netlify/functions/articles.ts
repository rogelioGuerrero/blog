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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!sql) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Database not configured' }),
    };
  }

  try {
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
  } catch (error) {
    console.error('Error fetching articles from Neon', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
