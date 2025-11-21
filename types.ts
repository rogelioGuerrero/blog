
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
  views?: number; // Internal analytics
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
}

export type ViewState = 'HOME' | 'ARTICLE' | 'ADMIN' | 'ARCHIVE';