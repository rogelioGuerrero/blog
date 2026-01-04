import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Article, AppSettings } from '../types';
import MediaCarousel from './MediaCarousel';
import { ArrowLeft, Clock, Share2, PlayCircle, PauseCircle, BookOpen, Calendar, User, ExternalLink, ArrowRight, Check } from 'lucide-react';

interface Props {
  article: Article;
  onBack: () => void;
  onNavigate: (id: string) => void;
  onPlayAudio: (article: Article) => void;
  isPlayingCurrent: boolean;
  relatedArticles: Article[];
  settings: AppSettings;
}

const ImageWithLoader: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-full h-full relative bg-slate-200 dark:bg-slate-800">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-300 dark:bg-slate-700" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'opacity-90 hover:opacity-100 scale-100' : 'opacity-0 scale-105'} group-hover:scale-105 group-hover:opacity-100`}
      />
      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
    </div>
  );
};

const generateId = (children: React.ReactNode): string => {
  const text = React.Children.toArray(children)
    .map(child => {
      if (typeof child === 'string') return child;
      if (typeof child === 'number') return child.toString();
      return '';
    })
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return text;
};

const getDomainFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
};

const ArticleViewVideoFirst: React.FC<Props> = ({ article, onBack, onNavigate, onPlayAudio, isPlayingCurrent, relatedArticles, settings }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const siteName = settings.siteName;
    document.title = `${article.title} | ${siteName}`;

    return () => {
      document.title = siteName;
    };
  }, [article, settings.siteName]);

  useEffect(() => {
    const update = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: article.title,
      text: article.excerpt,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share dialog closed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard. Context might be insecure.', err);
      }
    }
  };

  const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    a: ({ href, children, ...props }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-700 dark:text-indigo-400 border-b border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-600 dark:hover:border-indigo-400 transition-colors pb-0.5 font-medium"
        {...props}
      >
        {children}
      </a>
    ),
    h1: ({ children, ...props }) => (
      <h1
        id={generateId(children)}
        className="scroll-mt-32 text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-12 mb-6 tracking-tight leading-tight"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        id={generateId(children)}
        className="scroll-mt-32 text-2xl font-serif font-bold text-slate-800 dark:text-slate-200 mt-10 mb-4 tracking-tight leading-snug"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        id={generateId(children)}
        className="scroll-mt-32 text-xl font-serif font-semibold text-slate-800 dark:text-slate-200 mt-8 mb-3"
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-6 text-[1.05rem] leading-8 text-slate-700 dark:text-slate-300 font-serif antialiased text-justify sm:text-left">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside ml-5 mb-6 text-slate-700 dark:text-slate-300 font-serif text-[1.05rem] leading-8 marker:text-slate-400">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside ml-5 mb-6 text-slate-700 dark:text-slate-300 font-serif text-[1.05rem] leading-8 marker:text-slate-400">
        {children}
      </ol>
    ),
    blockquote: ({ children }) => (
      <div className="my-10 pl-6 border-l-4 border-indigo-500/30 dark:border-indigo-500/50">
        <blockquote className="text-xl font-serif italic text-slate-600 dark:text-slate-400 leading-relaxed">
          "{children}"
        </blockquote>
      </div>
    ),
    code: ({ children }) => (
      <code className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">
        {children}
      </code>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-slate-900 dark:text-slate-100">{children}</strong>
    ),
  };

  const hasVideo = article.media.some(m => m.type === 'video');
  const useVideoFirstLayout = isMobile && hasVideo;

  const header = (
    <header className="mb-10">
      <h1 className="text-4xl sm:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
        {article.title}
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 font-serif leading-relaxed mb-8 font-light italic">
        {article.excerpt}
      </p>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 border-t border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-sans text-sm font-bold">
            <User size={14} className="text-slate-500" />
            <span className="tracking-wide">{article.author}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 text-xs font-sans uppercase tracking-wider font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {article.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {article.readTime} min read
            </span>
          </div>
        </div>
      </div>
    </header>
  );

  const content = (
    <article className="article-content selection:bg-indigo-100 dark:selection:bg-indigo-900/30 selection:text-indigo-900 dark:selection:text-indigo-200">
      <div
        className="[&>p:first-of-type]:first-letter:text-[4rem] [&>p:first-of-type]:first-letter:font-serif [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:text-slate-900 dark:[&>p:first-of-type]:first-letter:text-slate-100 [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:leading-[0.85] [&>p:first-of-type]:first-of-type:mt-2"
      >
        <ReactMarkdown components={MarkdownComponents}>{article.content}</ReactMarkdown>
      </div>
    </article>
  );

  return (
    <div className="animate-fade-in">
      <div className="max-w-[720px] mx-auto bg-transparent">
        <div className="mt-4 mb-12 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-500 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs font-sans font-medium uppercase tracking-widest"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <span className="text-xs font-sans font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {article.category}
          </span>
        </div>

        {useVideoFirstLayout ? (
          <>
            <div className="mb-6">
              <MediaCarousel
                media={article.media}
                autoAdvance
                autoAdvanceIntervalMs={6000}
                hideArrows
                overlay={
                  article.audioUrl && (/^https?:\/\//.test(article.audioUrl) || article.audioUrl.startsWith('data:audio')) ? (
                    <button
                      onClick={() => onPlayAudio(article)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-slate-900/90 text-white text-[11px] font-bold uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-colors"
                    >
                      {isPlayingCurrent ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                      <span>{isPlayingCurrent ? 'Listening' : 'Listen'}</span>
                    </button>
                  ) : undefined
                }
              />
            </div>
            {header}
          </>
        ) : (
          <>
            {header}
            <div className="mb-12">
              <MediaCarousel media={article.media} />
            </div>
          </>
        )}

        {useVideoFirstLayout ? (
          <article className="article-content selection:bg-indigo-100 dark:selection:bg-indigo-900/30 selection:text-indigo-900 dark:selection:text-indigo-200">
            <div className="relative">
              <div className={isExpanded ? '' : 'max-h-[420px] overflow-hidden'}>
                <div
                  className="[&>p:first-of-type]:first-letter:text-[4rem] [&>p:first-of-type]:first-letter:font-serif [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:text-slate-900 dark:[&>p:first-of-type]:first-letter:text-slate-100 [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:leading-[0.85] [&>p:first-of-type]:first-of-type:mt-2"
                >
                  <ReactMarkdown components={MarkdownComponents}>{article.content}</ReactMarkdown>
                </div>
              </div>
              {!isExpanded && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent" />
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isExpanded ? 'Ocultar texto' : 'Leer artículo completo'}
              </button>
            </div>
          </article>
        ) : (
          content
        )}

        {relatedArticles.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-6">
              Related Stories
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedArticles.map(related => (
                <div
                  key={related.id}
                  onClick={() => {
                    onNavigate(related.id);
                  }}
                  className="group cursor-pointer flex flex-col gap-3"
                >
                  <div className="aspect-[3/2] w-full rounded-lg overflow-hidden relative">
                    <ImageWithLoader src={related.media[0]?.src} alt={related.title} />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-slate-900 dark:text-slate-200 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2 text-sm line-clamp-2">
                      {related.title}
                    </h5>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                      Read More <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {article.sources && article.sources.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-6">
              <BookOpen size={14} />
              Sources & References
            </h4>
            <ul className="flex flex-wrap gap-3">
              {article.sources.map((source, idx) => {
                const domain = getDomainFromUrl(source);
                return (
                  <li key={idx}>
                    {source.startsWith('http') ? (
                      <a
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                      >
                        {domain}
                        <ExternalLink size={10} className="opacity-50" />
                      </a>
                    ) : (
                      <span className="inline-block px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                        {source}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-24 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-center">
          <button
            onClick={handleShare}
            className={`flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-widest ${
              isCopied ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            {isCopied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{isCopied ? 'Link Copied!' : 'Share Story'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleViewVideoFirst;
