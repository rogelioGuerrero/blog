import React from 'react';
import { Article } from '../../types';
import { Play } from 'lucide-react';

interface ArticleGridProps {
  articles: Article[];
  layout: 'hero_masonry' | 'hero_list' | 'hero_grid';
  onArticleClick: (id: string) => void;
  isDefaultView: boolean;
}

export function ArticleGrid({ articles, layout, onArticleClick, isDefaultView }: ArticleGridProps) {
  if (layout === 'hero_list') {
    return <ListLayout articles={articles} onArticleClick={onArticleClick} />;
  }

  return (
    <MasonryLayout
      articles={articles}
      onArticleClick={onArticleClick}
      isDefaultView={isDefaultView}
    />
  );
}

interface ListLayoutProps {
  articles: Article[];
  onArticleClick: (id: string) => void;
}

function ListLayout({ articles, onArticleClick }: ListLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {articles.map(article => {
        const coverMedia = article.media[0];
        const isVideo = coverMedia?.type === 'video';
        return (
          <article
            key={article.id}
            onClick={() => onArticleClick(article.id)}
            className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-black/40 transition-all flex flex-col sm:flex-row"
          >
            <div className="relative w-full sm:w-40 h-40 sm:h-full bg-slate-900 flex-shrink-0">
              {isVideo ? (
                <video
                  src={coverMedia?.src}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={coverMedia?.src}
                  alt={article.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
              <span className="absolute left-3 bottom-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20">
                {article.category}
              </span>
            </div>
            <div className="flex-1 flex flex-col p-4 gap-2">
              <h4 className="font-serif font-semibold text-slate-900 dark:text-white text-base line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {article.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                {article.excerpt}
              </p>
              <div className="mt-auto flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>{article.date}</span>
                <span className="flex items-center gap-1">
                  {article.views ?? 0} views
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

interface MasonryLayoutProps {
  articles: Article[];
  onArticleClick: (id: string) => void;
  isDefaultView: boolean;
}

function MasonryLayout({ articles, onArticleClick, isDefaultView }: MasonryLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
      {articles.map((article, idx) => {
        const coverMedia = article.media[0];
        const isVideo = coverMedia?.type === 'video';
        const isLarge = isDefaultView && idx === 0;

        return (
          <div
            key={article.id}
            onClick={() => onArticleClick(article.id)}
            className={`group relative rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col ${isLarge ? 'md:col-span-2' : ''}`}
          >
            <div className="absolute inset-0 z-0 bg-slate-900">
              {isVideo ? (
                <video
                  src={coverMedia?.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                />
              ) : (
                <img
                  src={coverMedia?.src}
                  alt={article.title}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-end p-8">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white text-xs font-bold uppercase tracking-wider border border-white/10">
                  {article.category}
                </span>
                {(article.audioUrl || isVideo) && (
                  <Play size={16} className="text-white opacity-90" fill="currentColor" />
                )}
              </div>
              <h4 className={`font-serif font-bold text-white mb-2 leading-snug ${isLarge ? 'text-3xl' : 'text-xl'}`}>
                {article.title}
              </h4>
              <p className="text-slate-200 text-sm line-clamp-2 mb-4 font-medium opacity-90">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="text-white">{article.author}</span>
                <span>•</span>
                <span>{article.date}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
