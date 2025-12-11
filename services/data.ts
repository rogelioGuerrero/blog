

import { Article, AppSettings } from '../types';

// --- TYPES ---
// Re-exported from types.ts for convenience if needed, but usually imported directly.
export { type AppSettings };

/**
 * INTEGRATION POINT:
 * Initial Seed Data - Empty by default, data comes from API/Neon
 */
const SEED_DATA: any[] = [];

const DEFAULT_LOGO_URL = "";

const DEFAULT_SETTINGS: AppSettings = {
    siteName: "Mi Blog",
    navCategories: [],
    contactEmail: "",
    footerDescription: "",
    footerLinks: [],
    logoUrl: DEFAULT_LOGO_URL,
    homeLayout: 'hero_masonry'
};

const STORAGE_KEY_ARTICLES = 'blog_articles_v3'; // Increment version to force refresh if needed
const STORAGE_KEY_SETTINGS = 'blog_settings_v3';

// --- ARTICLES LOGIC ---

const loadArticles = (): Article[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_ARTICLES);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Migration helper: ensure views exist
            return parsed.map((a: any) => ({...a, views: a.views || 0}));
        }
    } catch (e) {
        console.error("Failed to load articles from local storage", e);
    }
    return SEED_DATA.map(normalizeArticle);
};

// --- SETTINGS LOGIC ---

const loadSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with default to ensure new fields exist for existing users
            return { 
                ...DEFAULT_SETTINGS, 
                ...parsed, 
                footerLinks: parsed.footerLinks || [],
                logoUrl: parsed.logoUrl || DEFAULT_SETTINGS.logoUrl,
                homeLayout: parsed.homeLayout || DEFAULT_SETTINGS.homeLayout
            };
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return DEFAULT_SETTINGS;
}

const sanitizeCaption = (caption?: string): string | undefined => {
    if (!caption) return undefined;
    const lower = caption.toLowerCase();
    
    const promptIndicators = [
        'illustration in a',
        'photorealistic image',
        'create an image',
        'generate a video',
        'detailed shot of',
        'ultra realistic',
        '4k', '8k',
        'octane render',
        'unreal engine',
        'style of'
    ];

    if (promptIndicators.some(indicator => lower.includes(indicator))) {
        return undefined;
    }

    if (caption.length > 120) {
        return undefined;
    }

    return caption;
};

export const normalizeArticle = (data: any): Article => {
  let authorName = data.author || 'Redacción';
  const lowerAuthor = authorName.toLowerCase();
  if (
    lowerAuthor.includes('ai') || 
    lowerAuthor.includes('gpt') || 
    lowerAuthor.includes('bot') ||
    lowerAuthor.includes('newsgen')
  ) {
    authorName = 'Redacción AGTI SA';
  }

  const rawMedia = Array.isArray(data.media) ? data.media : [];
  const cleanedMedia = rawMedia.map((m: any) => ({
      ...m,
      caption: sanitizeCaption(m.caption)
  }));

  return {
    id: data.id || Math.random().toString(36).substr(2, 9),
    title: data.title || 'Untitled Article',
    excerpt: data.excerpt || '',
    content: data.content || '',
    media: cleanedMedia,
    audioUrl: data.audioUrl,
    category: data.category || 'General',
    date: data.date || new Date().toLocaleDateString(),
    author: authorName, 
    featured: !!data.featured,
    readTime: data.readTime || 5,
    sources: Array.isArray(data.sources) ? data.sources : [],
    views: data.views || 0
  };
};

export const SEED_ARTICLES: Article[] = SEED_DATA.map(normalizeArticle);
export const DEFAULT_APP_SETTINGS: AppSettings = DEFAULT_SETTINGS;

// Mutable in-memory stores
let currentArticles = loadArticles();
let currentSettings = loadSettings();

// --- EXPORTS ---

export const getArticles = () => currentArticles;
export const getSettings = () => currentSettings;

export const saveArticle = (newArticle: Article) => {
    // Backup current state in case save fails
    const previousArticles = [...currentArticles];

    const existingIndex = currentArticles.findIndex(a => 
        (newArticle.id && a.id === newArticle.id) || 
        (a.title === newArticle.title)
    );

    if (existingIndex > -1) {
        const existingArticle = currentArticles[existingIndex];
        const updatedArticle = { 
            ...newArticle, 
            id: existingArticle.id,
            views: existingArticle.views // Preserve views on update
        };

        const newArticles = [...currentArticles];
        newArticles[existingIndex] = updatedArticle;
        currentArticles = newArticles;
    } else {
        currentArticles = [newArticle, ...currentArticles];
    }
    
    try {
        localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(currentArticles));
    } catch (e: any) {
        console.error("Failed to save articles", e);
        // REVERT state to prevent desync between UI and Storage
        currentArticles = previousArticles;
        
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            throw new Error("Storage Full: Image data is too large. Please use image URLs instead of Base64/Uploads.");
        }
        throw e;
    }
    
    return currentArticles;
};

export const incrementArticleView = (id: string) => {
    const index = currentArticles.findIndex(a => a.id === id);
    if (index > -1) {
        const article = currentArticles[index];
        const updatedArticle = { ...article, views: (article.views || 0) + 1 };
        const newArticles = [...currentArticles];
        newArticles[index] = updatedArticle;
        currentArticles = newArticles;
        try {
            localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(currentArticles));
        } catch (e) {
            console.error("Failed to increment view", e);
        }
    }
};

export const deleteArticle = (id: string) => {
    currentArticles = currentArticles.filter(a => a.id !== id);
    try {
        localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(currentArticles));
    } catch (e) {
        console.error("Failed to delete article", e);
    }
    return currentArticles;
};

export const saveSettings = (newSettings: AppSettings) => {
    currentSettings = newSettings;
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(currentSettings));
    } catch (e: any) {
        console.error("Failed to save settings", e);
         if (e.name === 'QuotaExceededError' || e.code === 22) {
            throw new Error("Storage Full: Logo image might be too large.");
        }
        throw e;
    }
    return currentSettings;
};

export const resetData = () => {
    currentArticles = SEED_DATA.map(normalizeArticle);
    currentSettings = DEFAULT_SETTINGS;
    localStorage.removeItem(STORAGE_KEY_ARTICLES);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    return { articles: currentArticles, settings: currentSettings };
};

export const articles = currentArticles; 

export const getArticleById = (id: string) => currentArticles.find(a => a.id === id);
export const getFeaturedArticle = () => currentArticles.find(a => a.featured) || currentArticles[0];
export const getRecentArticles = () => currentArticles.filter(a => !a.featured);