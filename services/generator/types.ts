// Types for the AI Article Generator module

export interface GeneratorSource {
  title: string;
  uri: string;
}

export interface RawSourceChunk {
  title?: string | null;
  uri?: string | null;
  snippet?: string | null;
  provider?: string | null;
}

export interface GeneratorMediaItem {
  type: 'image' | 'video';
  data: string; // Base64 or URL
  mimeType: string;
}

export interface GeneratedArticle {
  id: string;
  createdAt: number;
  topic: string;
  title: string;
  content: string;
  sources: GeneratorSource[];
  rawSources?: RawSourceChunk[];
  media: GeneratorMediaItem[];
  audioUrl?: string;
  language: GeneratorLanguage;
  keywords: string[];
  metaDescription: string;
  imagePrompt: string;
}

export enum GeneratorStep {
  INPUT = 0,
  TEXT_SEARCH = 1,
  TEXT_REVIEW = 2,
  MEDIA_REVIEW = 3,
  COMPLETE = 4
}

export type GeneratorInputMode = 'topic' | 'document';

export type GeneratorLanguage = 'es' | 'en' | 'fr' | 'pt' | 'de';

export type ArticleLength = 'short' | 'medium' | 'long';

export type ArticleTone = 'objective' | 'editorial' | 'corporate' | 'narrative' | 'satirical' | 'sensational' | 'explanatory';

export type ArticleAudience = 'general' | 'expert' | 'investor' | 'executive' | 'academic';

export type ArticleFocus = 'general' | 'economic' | 'political' | 'social' | 'technological';

export type TimeFrame = '24h' | 'week' | 'month' | 'any';

export type VisualStyle = 'photorealistic' | 'illustration' | 'cyberpunk' | 'minimalist' | 'data';

export type SourceRegion = 'world' | 'us' | 'eu' | 'latam' | 'asia';

export interface GeneratorAdvancedSettings {
  tone: ArticleTone;
  audience: ArticleAudience;
  focus: ArticleFocus;
  timeFrame: TimeFrame;
  visualStyle: VisualStyle;
  sourceRegion: SourceRegion;
  preferredDomains: string[];
  blockedDomains: string[];
  verifiedSourcesOnly: boolean;
  includeQuotes: boolean;
  includeStats: boolean;
  includeCounterArguments: boolean;
}

export interface UploadedFile {
  data: string; // Base64
  mimeType: string;
  name: string;
}

export interface GeneratorConfig {
  geminiApiKey: string;
  pexelsApiKey: string;
  preferredDomains: string[];
  blockedDomains: string[];
}

// Constants
export const LENGTHS: { code: ArticleLength; label: string; desc: string }[] = [
  { code: 'short', label: 'Breve', desc: '~300' },
  { code: 'medium', label: 'Estándar', desc: '~600' },
  { code: 'long', label: 'Profundo', desc: '~1000' },
];

export const LANGUAGES: { code: GeneratorLanguage; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'Inglés' },
  { code: 'fr', label: 'Francés' },
];

export const PLACEHOLDERS = [
  "Ej: Startups de IA en Latam...",
  "Ej: Crisis climática y energías renovables...",
  "Ej: Resultados de la Champions League...",
  "Ej: Avances en computación cuántica...",
  "Ej: Tendencias de mercado crypto..."
];

export const REGION_DOMAIN_MAP: Record<SourceRegion, string[]> = {
  world: [],
  us: ['bloomberg.com', 'wsj.com', 'reuters.com', 'nytimes.com', 'washingtonpost.com', 'cnbc.com', 'ft.com'],
  eu: ['ec.europa.eu', 'ecb.europa.eu', 'politico.eu', 'ft.com', 'reuters.com', 'bbc.co.uk', 'lesechos.fr', 'faz.net', 'expansion.com', 'elpais.com'],
  latam: ['infobae.com', 'elpais.com/america', 'eleconomista.com.mx', 'portafolio.co', 'gestion.pe', 'df.cl', 'latercera.com', 'valor.globo.com'],
  asia: []
};

export const MULTILATERAL_DOMAINS = ['imf.org', 'worldbank.org', 'cepal.org', 'iadb.org'];

export const getRegionPreferredDomains = (region: SourceRegion): string[] => {
  const regional = REGION_DOMAIN_MAP[region] || [];
  const combined = [...regional, ...MULTILATERAL_DOMAINS];
  return Array.from(new Set(combined));
};

export const DEFAULT_ADVANCED_SETTINGS: GeneratorAdvancedSettings = {
  tone: 'objective',
  audience: 'general',
  focus: 'general',
  timeFrame: 'any',
  visualStyle: 'photorealistic',
  sourceRegion: 'world',
  preferredDomains: getRegionPreferredDomains('world'),
  blockedDomains: [],
  verifiedSourcesOnly: false,
  includeQuotes: false,
  includeStats: false,
  includeCounterArguments: false
};
