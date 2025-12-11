import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ArticleView from './components/ArticleView';
import ArticleViewVideoFirst from './components/ArticleViewVideoFirst';
import AudioPlayer from './components/AudioPlayer';
import AdminEditor from './components/AdminEditor';
import Footer from './components/Footer';
import { GridSkeleton, ArticleSkeleton } from './components/Skeletons';
import PinModal from './components/PinModal';
import { SecretMenu } from './components/SecretMenu';
import { GeneratorPanel } from './components/generator';
import { getArticlesFromApi, getSettingsFromApi, incrementArticleViewApi } from './services/api';
import { DEFAULT_APP_SETTINGS } from './services/data';
import { Article, AppSettings, ViewState } from './types';
import { ArrowRight, Play, SearchX } from 'lucide-react';

function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<{ src: string | null; title: string | null; articleId: string | null }>({
    src: null,
    title: null,
    articleId: null
  });
  
  // Loading State for UX Transitions
  const [isLoading, setIsLoading] = useState(false);
  // Ref to cancel timeouts if user navigates quickly
  const transitionTimeoutRef = useRef<number | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [archiveDateFilter, setArchiveDateFilter] = useState<'all' | 'last30' | 'last365'>('all');
  const [archivePage, setArchivePage] = useState(1);

  // Force re-render when data changes
  const [dataVersion, setDataVersion] = useState(0);

  const [articles, setArticles] = useState<Article[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Secret Access State
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecretMenu, setShowSecretMenu] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const allArticles = articles;
  const featuredArticle = allArticles.find(a => a.featured) || allArticles[0];
  const homeLayout = settings.homeLayout || 'hero_masonry';
  
  // Filter Logic
  const filteredArticles = allArticles.filter(article => {
    const matchesSearch = (
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCategory = activeCategory === 'All' || article.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Exclude featured article from grid ONLY if we are in default view (No search, All categories)
  const displayArticles = (searchQuery || activeCategory !== 'All' || !featuredArticle) 
      ? filteredArticles 
      : filteredArticles.filter(a => a.id !== featuredArticle.id);

  // Archive-specific filtering (date) and pagination
  const now = Date.now();
  const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;
  const MS_365_DAYS = 365 * 24 * 60 * 60 * 1000;

  const archiveFilteredByDate = filteredArticles.filter(article => {
    if (archiveDateFilter === 'all') return true;
    const t = new Date(article.date).getTime();
    if (isNaN(t)) return true;
    const delta = now - t;
    if (archiveDateFilter === 'last30') return delta <= MS_30_DAYS;
    if (archiveDateFilter === 'last365') return delta <= MS_365_DAYS;
    return true;
  });

  const ARCHIVE_PAGE_SIZE = 9;
  const archiveSorted = [...archiveFilteredByDate].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
  });

  const archiveTotalPages = Math.max(1, Math.ceil(archiveSorted.length / ARCHIVE_PAGE_SIZE));
  const safeArchivePage = Math.min(archivePage, archiveTotalPages);
  const archivePageStart = (safeArchivePage - 1) * ARCHIVE_PAGE_SIZE;
  const archivePageItems = archiveSorted.slice(archivePageStart, archivePageStart + ARCHIVE_PAGE_SIZE);

  // --- DEEP LINKING & HISTORY LOGIC ---
  
  // 1. Bootstrap data (settings + articles) and handle deep-linking
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [remoteSettings, remoteArticles] = await Promise.all([
          getSettingsFromApi(),
          getArticlesFromApi(),
        ]);

        if (cancelled) return;

        setSettings(remoteSettings);
        setArticles(remoteArticles);

        // Deep link handling after data is loaded
        try {
          const params = new URLSearchParams(window.location.search);
          const sharedArticleId = params.get('articleId');

          if (sharedArticleId) {
            const exists = remoteArticles.find(a => a.id === sharedArticleId);
            if (exists) {
              try {
                const updated = await incrementArticleViewApi(sharedArticleId);
                setArticles(prev => {
                  const index = prev.findIndex(a => a.id === updated.id);
                  if (index === -1) return prev;
                  const copy = [...prev];
                  copy[index] = updated;
                  return copy;
                });
              } catch (e) {
                console.error('Failed to increment view for shared article', e);
              }

              setSelectedArticleId(sharedArticleId);
              setView('ARTICLE');
            }
          }
        } catch (e) {
          console.log("URL parsing unavailable in this environment");
        }
      } catch (e) {
        console.error('Failed to bootstrap data from API', e);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  // 2. Handle Browser Back/Forward Buttons
  useEffect(() => {
      const handlePopState = (event: PopStateEvent) => {
          // Cancel any pending transition
          if (transitionTimeoutRef.current) {
              clearTimeout(transitionTimeoutRef.current);
          }
          setIsLoading(false); // Immediate update for browser navigation

          const params = new URLSearchParams(window.location.search);
          const sharedArticleId = params.get('articleId');
          
          if (!sharedArticleId && view === 'ARTICLE') {
              setView('HOME');
              setSelectedArticleId(null);
          } else if (sharedArticleId && sharedArticleId !== selectedArticleId) {
               const exists = allArticles.find(a => a.id === sharedArticleId);
               if (exists) {
                   setSelectedArticleId(sharedArticleId);
                   setView('ARTICLE');
               } else {
                   // If ID invalid, go home
                   setView('HOME');
               }
          }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [view, selectedArticleId, allArticles]);

  // Reset archive pagination when filters change
  useEffect(() => {
    setArchivePage(1);
  }, [searchQuery, activeCategory, archiveDateFilter]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedArticleId]);

  // Handlers with Simulated Loading
  const handleArticleClick = (id: string) => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    
    setIsLoading(true);
    window.scrollTo(0,0);
    
    // Update URL safely
    try {
        const newUrl = `${window.location.pathname}?articleId=${id}`;
        window.history.pushState({ articleId: id }, '', newUrl);
    } catch (e) {
        // Ignore security errors in sandboxed environments (e.g. blob: URLs)
        console.warn("Deep linking disabled: History API unavailable in this environment.");
    }

    transitionTimeoutRef.current = window.setTimeout(async () => {
        try {
          const updated = await incrementArticleViewApi(id);
          setArticles(prev => {
            const index = prev.findIndex(a => a.id === updated.id);
            if (index === -1) return prev;
            const copy = [...prev];
            copy[index] = updated;
            return copy;
          });
        } catch (e) {
          console.error('Failed to increment article view', e);
        }

        setSelectedArticleId(id);
        setView('ARTICLE');
        setIsLoading(false);
    }, 600);
  };

  const handleHomeClick = () => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    if (view === 'HOME') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    setIsLoading(true);
    window.scrollTo(0,0);
    
    // Reset URL safely
    try {
        window.history.pushState({}, '', window.location.pathname);
    } catch (e) {
        console.warn("Deep linking disabled: History API unavailable in this environment.");
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
        setView('HOME');
        setSearchQuery('');
        setActiveCategory('All');
        setDataVersion(v => v + 1);
        setIsLoading(false);
    }, 500);
  };

  const handleSecretAccess = () => {
      setShowPinModal(true);
  };

  const handlePinSuccess = () => {
      setShowPinModal(false);
      setShowSecretMenu(true);
  };

  const handleSelectGenerator = () => {
      setShowSecretMenu(false);
      setShowGenerator(true);
  };

  const handleSelectAdmin = () => {
      setShowSecretMenu(false);
      setView('ADMIN');
  };

  const handleArticleSaved = (savedArticle: Article) => {
      setArticles(prev => [savedArticle, ...prev.filter(a => a.id !== savedArticle.id)]);
      setDataVersion(v => v + 1);
  };

  const handleArchiveClick = () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      setIsLoading(false);
      setView('ARCHIVE');
      window.scrollTo(0, 0);
  };

  const handlePlayAudio = (article: Article) => {
    if (!article.audioUrl) return;
    if (!/^https?:\/\//.test(article.audioUrl) && !article.audioUrl.startsWith('data:audio')) {
        console.warn('Invalid audio URL, skipping audio playback:', article.audioUrl);
        return;
    }
    if (audioState.articleId === article.id) {
        setAudioState({ src: null, title: null, articleId: null });
        return;
    }
    setAudioState({
        src: article.audioUrl,
        title: article.title,
        articleId: article.id
    });
  };

  const handleCloseAudio = () => {
      setAudioState({ src: null, title: null, articleId: null });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors duration-300">
      
      <Navbar 
        onHome={handleHomeClick} 
        onSecret={handleSecretAccess}
        onSearch={setSearchQuery}
        searchTerm={searchQuery}
        onCategorySelect={setActiveCategory}
        activeCategory={activeCategory}
        settings={settings}
        onArchive={handleArchiveClick}
        isArchiveActive={view === 'ARCHIVE'}
      />

      <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        {/* RENDER SKELETONS DURING BOOTSTRAP OR LOADING */}
        {isBootstrapping ? (
            <GridSkeleton />
        ) : isLoading ? (
             view === 'HOME' || view === 'ADMIN' ? (
                 /* Transitioning TO Article from Home, or TO Home from Article */
                 view === 'HOME' ? <ArticleSkeleton /> : <GridSkeleton />
             ) : (
                 /* If view is ARTICLE, and loading, we are likely going HOME */
                 <GridSkeleton />
             )
        ) : (
            <>
                {view === 'HOME' && !isBootstrapping && (
                <div className="max-w-7xl mx-auto animate-fade-in">
                    
                    {/* Hero Section */}
                    {!searchQuery && activeCategory === 'All' && featuredArticle && (
                        <section className="mb-12 md:mb-20 group cursor-pointer relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/5 border border-slate-200 dark:border-white/10 bg-slate-900" onClick={() => handleArticleClick(featuredArticle.id)}>
                            <div className="absolute inset-0">
                                {featuredArticle.media.find(m => m.type === 'video') ? (
                                    <video 
                                        src={featuredArticle.media.find(m => m.type === 'video')?.src} 
                                        autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                ) : (
                                    <img 
                                        src={featuredArticle.media[0]?.src} 
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
                                    {featuredArticle.title}
                                </h2>
                                <p className="text-lg text-slate-200 mb-8 max-w-2xl line-clamp-2 drop-shadow-md font-medium">
                                    {featuredArticle.excerpt}
                                </p>
                                <button className="flex items-center gap-2 text-white font-bold text-lg hover:gap-4 transition-all">
                                    Read Article <ArrowRight size={20} />
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Filter Results Header */}
                    {(searchQuery || activeCategory !== 'All') && (
                        <div className="mb-8 pb-4 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
                                {searchQuery ? `Searching for "${searchQuery}"` : `${activeCategory} Stories`}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Found {displayArticles.length} articles
                            </p>
                        </div>
                    )}

                    {/* Bento Grid / Masonry */}
                    <section>
                        {!searchQuery && activeCategory === 'All' && (
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-serif">Latest Stories</h3>
                            </div>
                        )}
                        {displayArticles.length > 0 ? (
                          homeLayout === 'hero_list' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {displayArticles.map(article => {
                                const coverMedia = article.media[0];
                                const isVideo = coverMedia?.type === 'video';
                                return (
                                  <article
                                    key={article.id}
                                    onClick={() => handleArticleClick(article.id)}
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
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
                              {displayArticles.map((article, idx) => {
                                const coverMedia = article.media[0];
                                const isVideo = coverMedia?.type === 'video';
                                const isLarge = homeLayout === 'hero_masonry' && idx === 0 && !searchQuery && activeCategory === 'All';

                                return (
                                  <div
                                    key={article.id}
                                    onClick={() => handleArticleClick(article.id)}
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
                                          className="w-full h-full object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duración-500"
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
                          )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-70">
                                <SearchX size={48} className="text-slate-400 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No stories found</h3>
                                <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or category filter.</p>
                                <button 
                                    onClick={handleHomeClick}
                                    className="mt-6 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </section>
                </div>
                )}
                {view === 'ARCHIVE' && !isBootstrapping && (
                  <div className="max-w-7xl mx-auto animate-fade-in">
                    <header className="mb-8 pb-4 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-1">Archive</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Browse all published stories. Use the top navigation and search to filter by category and keywords.
                        </p>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                        {archiveFilteredByDate.length} articles
                      </div>
                    </header>

                    {archiveFilteredByDate.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 opacity-70">
                        <SearchX size={48} className="text-slate-400 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No stories in archive</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                          Try changing the category or clearing the search box to see more results.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
                            <span className="font-semibold uppercase tracking-widest">Date range:</span>
                            <button
                              onClick={() => setArchiveDateFilter('all')}
                              className={`px-3 py-1 rounded-full border transition-colors ${
                                archiveDateFilter === 'all'
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                              }`}
                            >
                              All time
                            </button>
                            <button
                              onClick={() => setArchiveDateFilter('last30')}
                              className={`px-3 py-1 rounded-full border transition-colors ${
                                archiveDateFilter === 'last30'
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                              }`}
                            >
                              Last 30 days
                            </button>
                            <button
                              onClick={() => setArchiveDateFilter('last365')}
                              className={`px-3 py-1 rounded-full border transition-colors ${
                                archiveDateFilter === 'last365'
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                              }`}
                            >
                              Last year
                            </button>
                          </div>

                          {archiveTotalPages > 1 && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                              <button
                                onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                                disabled={safeArchivePage === 1}
                                className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-900"
                              >
                                Previous
                              </button>
                              <span>
                                Page {safeArchivePage} of {archiveTotalPages}
                              </span>
                              <button
                                onClick={() => setArchivePage(p => Math.min(archiveTotalPages, p + 1))}
                                disabled={safeArchivePage === archiveTotalPages}
                                className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-900"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {archivePageItems.map(article => {
                            const cover = article.media[0];
                            const isVideo = cover?.type === 'video';
                            return (
                              <article
                                key={article.id}
                                onClick={() => handleArticleClick(article.id)}
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
                          })}
                        </div>

                        {archiveTotalPages > 1 && (
                          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <button
                              onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                              disabled={safeArchivePage === 1}
                              className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-900"
                            >
                              Previous
                            </button>
                            <span>
                              Page {safeArchivePage} of {archiveTotalPages}
                            </span>
                            <button
                              onClick={() => setArchivePage(p => Math.min(archiveTotalPages, p + 1))}
                              disabled={safeArchivePage === archiveTotalPages}
                              className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-900"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {view === 'ARTICLE' && selectedArticleId && (
                  (() => {
                    const current = allArticles.find(a => a.id === selectedArticleId);
                    if (!current) return null;
                    const related = allArticles
                      .filter(a => a.category === current.category && a.id !== current.id)
                      .slice(0, 3);

                    const hasVideo = current.media.some(m => m.type === 'video');
                    const useVideoFirstLayout = isMobile && hasVideo;

                    if (useVideoFirstLayout) {
                      return (
                        <ArticleViewVideoFirst
                          article={current}
                          onBack={handleHomeClick}
                          onNavigate={handleArticleClick}
                          onPlayAudio={handlePlayAudio}
                          isPlayingCurrent={audioState.articleId === selectedArticleId}
                          relatedArticles={related}
                          settings={settings}
                        />
                      );
                    }

                    return (
                      <ArticleView 
                        article={current} 
                        onBack={handleHomeClick}
                        onNavigate={handleArticleClick}
                        onPlayAudio={handlePlayAudio}
                        isPlayingCurrent={audioState.articleId === selectedArticleId}
                        relatedArticles={related}
                        settings={settings}
                      />
                    );
                  })()
                )}
                {view === 'ADMIN' && (
                    <AdminEditor 
                      onClose={handleHomeClick}
                      onSettingsUpdated={(updated) => setSettings(updated)}
                      onArticlesUpdated={(updatedArticles) => setArticles(updatedArticles)}
                    />
                )}
            </>
        )}
      </main>
      
      {!isLoading && <Footer settings={settings} />}

      <AudioPlayer 
        src={audioState.src} 
        title={audioState.title} 
        onClose={handleCloseAudio} 
      />

      {/* PIN Modal for Generator Access */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Secret Menu - Choose Generator or Admin */}
      <SecretMenu
        isOpen={showSecretMenu}
        onClose={() => setShowSecretMenu(false)}
        onSelectGenerator={handleSelectGenerator}
        onSelectAdmin={handleSelectAdmin}
      />

      {/* AI Article Generator Panel */}
      <GeneratorPanel
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onArticleSaved={handleArticleSaved}
      />
    </div>
  );
}

export default App;