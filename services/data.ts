

import { Article, AppSettings } from '../types';

// --- TYPES ---
// Re-exported from types.ts for convenience if needed, but usually imported directly.
export { type AppSettings };

/**
 * INTEGRATION POINT:
 * Initial Seed Data.
 */
const SEED_DATA: any[] = [
  {
    id: '1',
    title: "The Quantum Leap: Computing's Next Frontier",
    excerpt: "How silicon qubits are reshaping the landscape of modern cryptography and complex problem solving in ways we never imagined.",
    content: `
## The Dawn of Qubits

We stand at the precipice of a new era. Quantum computing is no longer just a theoretical concept confined to physics papers; it is becoming a tangible reality.

> "Nature isn't classical, dammit, and if you want to make a simulation of nature, you'd better make it quantum mechanical." - Richard Feynman

Traditional computers use bits—0s and 1s. Quantum computers use **qubits**. This fundamental difference allows for superposition, where a qubit can exist in multiple states simultaneously.

### Why This Matters

1.  **Cryptography:** Current encryption standards could be rendered obsolete.
2.  **Drug Discovery:** Simulating molecular interactions at an atomic level.
3.  **Financial Modeling:** Optimizing complex portfolios in milliseconds.

The race is on between major tech giants to achieve *Quantum Supremacy*.
    `,
    media: [
      { type: 'video', src: 'https://cdn.coverr.co/videos/coverr-futuristic-city-loop-4329/1080p.mp4', caption: 'Visualizing the quantum realm.' },
      { type: 'image', src: 'https://images.pexels.com/photos/256297/pexels-photo-256297.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', caption: 'The cryogenic core of a quantum processor.' }
    ],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    category: 'Tech',
    date: 'Oct 24, 2023',
    author: 'Elena Fisher',
    featured: true,
    readTime: 5,
    sources: ['https://www.nature.com/articles/s41586-019-1666-5', 'https://www.ibm.com/quantum'],
    views: 1240
  },
  {
    id: '2',
    title: "Sustainable Minimalism in Corporate Architecture",
    excerpt: "Why top Fortune 500 companies are ditching skyscrapers for eco-friendly, horizontal campuses embedded in nature.",
    content: `
## Green over Grey

The concrete jungle is evolving. The new status symbol isn't the height of your tower, but the depth of your carbon footprint reduction.

Companies are moving towards **Biophilic Design**—the concept of increasing occupant connectivity to the natural environment through the use of direct nature, indirect nature, and space and place conditions.

### Key Benefits

*   **Employee Wellbeing:** Reduced stress and increased creativity.
*   **Energy Efficiency:** Passive cooling and natural lighting usage.
*   **Brand Image:** Demonstrating commitment to sustainability.

This shift represents a fundamental rethinking of the "office" as not just a place of production, but a place of *habitation*.
    `,
    media: [
      { type: 'image', src: 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', caption: 'The new Eco-HQ in Oslo.' },
      { type: 'image', src: 'https://images.pexels.com/photos/159213/hall-congress-architecture-building-159213.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', caption: 'Interior integration of plant life.' }
    ],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    category: 'Design',
    date: 'Oct 22, 2023',
    author: 'Marcus Chen',
    readTime: 3,
    sources: ['https://www.archdaily.com/tag/biophilic-design', 'https://hbr.org/2023/05/the-impact-of-green-buildings'],
    views: 856
  },
  {
    id: '3',
    title: "Global Markets React to Energy Policy Shifts",
    excerpt: "An in-depth analysis of how new renewable energy regulations in the EU are affecting Asian manufacturing stocks.",
    content: `
## The Ripple Effect

When Brussels sneezes, Tokyo catches a cold. The recent legislation passed by the European Union regarding carbon border taxes is sending shockwaves through global supply chains.

Manufacturers are now faced with a choice:
1.  Decarbonize rapidy.
2.  Face steep tariffs on exports to the EU.

### Market Analysis

The tech sector remains resilient, but heavy industry—steel, aluminum, and cement—is seeing significant volatility. Investors are hedging bets by moving capital into green hydrogen startups and battery technology.

*Forecasts suggest a 15% shift in capital allocation over the next fiscal quarter.*
    `,
    media: [
      { type: 'image', src: 'https://images.pexels.com/photos/187041/pexels-photo-187041.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', caption: 'Stock exchange data visualization.' },
    ],
    category: 'Business',
    date: 'Oct 20, 2023',
    author: 'Sarah Jenkins',
    readTime: 7,
    sources: ['https://www.bloomberg.com', 'https://www.ft.com'],
    views: 632
  },
    {
    id: '4',
    title: "Mars Colonization: The First Decade",
    excerpt: "A retrospective look from the future. What did the first ten years of the red planet settlement actually look like?",
    content: `
## Red Dust and Iron Will

The first boots on Mars didn't mark the end of the journey, but the beginning of the struggle. 

Survival wasn't guaranteed. The psychological toll of isolation, combined with the harsh radiation environment, tested the limits of human endurance. Yet, the colony of *Ares Prime* stands today.

### Technological Breakthroughs

The need for water recycling efficiency drove innovation that is now solving drought crises on Earth. The closed-loop life support systems became the blueprint for sustainable living.
    `,
    media: [
      { type: 'image', src: 'https://images.pexels.com/photos/87009/earth-soil-creep-moon-87009.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', caption: 'Concept art of Ares Prime.' },
    ],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    category: 'Science',
    date: 'Oct 18, 2023',
    author: 'Dr. Alan Grant',
    readTime: 12,
    views: 2105
  }
];

const DEFAULT_LOGO_URL = "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=100&auto=format&fit=crop";

const DEFAULT_SETTINGS: AppSettings = {
    siteName: "Lumina",
    navCategories: ["Tech", "Design", "Business", "Science", "Culture"],
    contactEmail: "info@agtisa.com",
    footerDescription: "We bridge the gap between complex information and actionable knowledge. Our mission is to curate, analyze, and present the stories that shape our future.",
    footerLinks: [],
    logoUrl: DEFAULT_LOGO_URL
};

const STORAGE_KEY_ARTICLES = 'lumina_articles_v2'; // Increment version to force refresh if needed
const STORAGE_KEY_SETTINGS = 'lumina_settings_v2';

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
                logoUrl: parsed.logoUrl || DEFAULT_SETTINGS.logoUrl
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
    authorName = 'Redacción Lumina';
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