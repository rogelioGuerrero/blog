import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NETLIFY_DATABASE_URL;

if (!connectionString) {
  console.warn('NETLIFY_DATABASE_URL is not set. Articles delete function will fail until this is configured.');
}

const sql = connectionString ? neon(connectionString) : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'DELETE') {
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

  const id = event.queryStringParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing article id' }),
    };
  }

  try {
    await sql`DELETE FROM articles WHERE id = ${id}`;

    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting article', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
