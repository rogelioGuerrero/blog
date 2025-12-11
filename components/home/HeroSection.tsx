import React from 'react';
import { Article } from '../../types';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  article: Article;
  onArticleClick: (id: string) => void;
}

export function HeroSection({ article, onArticleClick }: HeroSectionProps) {
  const videoMedia = article.media.find(m => m.type === 'video');

  return (
    <section
      className="mb-12 md:mb-20 group cursor-pointer relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/5 border border-slate-200 dark:border-white/10 bg-slate-900"
      onClick={() => onArticleClick(article.id)}
    >
      <div className="absolute inset-0">
        {videoMedia ? (
          <video
            src={videoMedia.src}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <img
            src={article.media[0]?.src}
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
            alt="Hero"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
      </div>

      <div className="relative h-[500px] md:h-[600px] flex flex-col justify-end p-8 md:p-16 items-start">
        <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-4 shadow-lg shadow-indigo-900/50">
          Featured
        </span>
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight max-w-4xl drop-shadow-lg">
          {article.title}
        </h2>
        <p className="text-lg text-slate-200 mb-8 max-w-2xl line-clamp-2 drop-shadow-md font-medium">
          {article.excerpt}
        </p>
        <button className="flex items-center gap-2 text-white font-bold text-lg hover:gap-4 transition-all">
          Read Article <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}
