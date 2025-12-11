import React from 'react';
import { Article } from '../../types';

interface ArchiveCardProps {
  article: Article;
  onClick: () => void;
}

export function ArchiveCard({ article, onClick }: ArchiveCardProps) {
  const cover = article.media[0];
  const isVideo = cover?.type === 'video';

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-black/40 transition-all flex flex-col"
    >
      <div className="relative h-40 bg-slate-900">
        {isVideo ? (
          <video
            src={cover.src}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={cover?.src}
            alt={article.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
        <span className="absolute left-4 bottom-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white border border-white/20">
          {article.category}
        </span>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-2">
        <h3 className="font-serif font-semibold text-slate-900 dark:text-white text-base line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {article.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
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
}
