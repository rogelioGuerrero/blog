export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Markdown
  media: { type: 'image' | 'video', src: string; caption?: string }[];
  audioUrl?: string;
  // Changed from strict union type to string to support dynamic JSON ingestion
  category: string; 
  date: string;
  author: string;
  featured?: boolean;
  readTime: number;
  sources?: string[];
  sourceCertificate?: SourceCertificate | null;
  views?: number; // Internal analytics
}

export interface SourceCertificateEntry {
  id: string;
  name: string;
  domain: string;
  url: string;
  categories: string[];
  mentions: number;
  snippet?: string | null;
}

export interface SourceCertificate {
  generatedAt: string;
  totalMentions: number;
  sources: SourceCertificateEntry[];
}

export interface ArticleSourcesPayload {
  list: string[];
  certificate?: SourceCertificate | null;
}

export interface FooterLink {
    label: string;
    url: string;
}

export interface AppSettings {
    siteName: string;
    navCategories: string[];
    contactEmail: string;
    footerDescription: string;
    footerLinks: FooterLink[];
    logoUrl?: string;
    homeLayout?: 'hero_masonry' | 'hero_grid' | 'hero_list';
}

export type ViewState = 'HOME' | 'ARTICLE' | 'ADMIN' | 'ARCHIVE';