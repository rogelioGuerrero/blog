import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NETLIFY_DATABASE_URL;

if (!connectionString) {
  console.warn('NETLIFY_DATABASE_URL is not set. Categories function will fail until this is configured.');
}

const sql = connectionString ? neon(connectionString) : null;

interface SettingsRow {
  id: string;
  site_name: string;
  nav_categories: string[] | null;
  contact_email: string;
  footer_description: string;
  footer_links: any | null;
  logo_url: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const mapRowToSettings = (row: SettingsRow) => ({
  siteName: row.site_name,
  navCategories: Array.isArray(row.nav_categories) ? row.nav_categories : [],
  contactEmail: row.contact_email,
  footerDescription: row.footer_description,
  footerLinks: Array.isArray(row.footer_links) ? row.footer_links : [],
  logoUrl: row.logo_url ?? undefined,
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

  const { httpMethod, body } = event;

  if (httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

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

  const oldNameRaw = payload.oldName;
  const newNameRaw = payload.newName;

  const oldName = typeof oldNameRaw === 'string' ? oldNameRaw.trim() : '';
  const newName = typeof newNameRaw === 'string' ? newNameRaw.trim() : '';

  if (!oldName || !newName) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Both oldName and newName are required' }),
    };
  }

  if (oldName === newName) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'New name must be different from old name' }),
    };
  }

  try {
    await sql`UPDATE articles SET category = ${newName} WHERE category = ${oldName}`;

    const rows = await sql`UPDATE app_settings
      SET nav_categories = array_replace(nav_categories, ${oldName}, ${newName}),
          updated_at = now()
      WHERE id = 'default'
      RETURNING id, site_name, nav_categories, contact_email, footer_description, footer_links, logo_url`;

    const typed = rows as unknown as SettingsRow[];

    if (!typed.length) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Settings not found' }),
      };
    }

    const settings = mapRowToSettings(typed[0]);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    };
  } catch (error) {
    console.error('Error renaming category', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
