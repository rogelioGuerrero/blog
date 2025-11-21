import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NETLIFY_DATABASE_URL;

if (!connectionString) {
  console.warn('NETLIFY_DATABASE_URL is not set. Settings function will fail until this is configured.');
}

const sql = connectionString ? neon(connectionString) : null;

interface SettingsRow {
  id: string;
  site_name: string;
  nav_categories: string[];
  contact_email: string;
  footer_description: string;
  footer_links: any | null;
  logo_url: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
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

  try {
    if (httpMethod === 'GET') {
      const rows = await sql`SELECT id, site_name, nav_categories, contact_email, footer_description, footer_links, logo_url FROM app_settings WHERE id = 'default' LIMIT 1`;
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
    }

    if (httpMethod === 'PUT') {
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

      const navCategories = Array.isArray(payload.navCategories) ? payload.navCategories : [];
      const footerLinks = Array.isArray(payload.footerLinks) ? payload.footerLinks : [];

      const rows = await sql`INSERT INTO app_settings (
          id,
          site_name,
          nav_categories,
          contact_email,
          footer_description,
          footer_links,
          logo_url
        ) VALUES (
          'default',
          ${payload.siteName},
          ${navCategories},
          ${payload.contactEmail},
          ${payload.footerDescription},
          ${footerLinks},
          ${payload.logoUrl ?? null}
        )
        ON CONFLICT (id) DO UPDATE SET
          site_name = EXCLUDED.site_name,
          nav_categories = EXCLUDED.nav_categories,
          contact_email = EXCLUDED.contact_email,
          footer_description = EXCLUDED.footer_description,
          footer_links = EXCLUDED.footer_links,
          logo_url = EXCLUDED.logo_url,
          updated_at = now()
        RETURNING id, site_name, nav_categories, contact_email, footer_description, footer_links, logo_url`;

      const typed = rows as unknown as SettingsRow[];
      const settings = mapRowToSettings(typed[0]);

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error handling settings request', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
