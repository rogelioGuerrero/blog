import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ArticleView from './components/ArticleView';
import AudioPlayer from './components/AudioPlayer';
import AdminEditor from './components/AdminEditor';
import Footer from './components/Footer';
import { GridSkeleton, ArticleSkeleton } from './components/Skeletons';
import { getArticles, getFeaturedArticle, getRecentArticles, incrementArticleView } from './services/data';
import { Article, ViewState } from './types';
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

  // Force re-render when data changes
  const [dataVersion, setDataVersion] = useState(0);
  
  const allArticles = getArticles();
  const featuredArticle = getFeaturedArticle();
  
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
  const displayArticles = (searchQuery || activeCategory !== 'All') 
      ? filteredArticles 
      : filteredArticles.filter(a => a.id !== featuredArticle.id);

  // --- DEEP LINKING & HISTORY LOGIC ---
  
  // 1. Check URL on load
  useEffect(() => {
    // Safe check for URL params
    try {
        const params = new URLSearchParams(window.location.search);
        const sharedArticleId = params.get('articleId');
        
        if (sharedArticleId) {
            const exists = allArticles.find(a => a.id === sharedArticleId);
            if (exists) {
                incrementArticleView(sharedArticleId);
                setSelectedArticleId(sharedArticleId);
                setView('ARTICLE');
            }
        }
    } catch (e) {
        console.log("URL parsing unavailable in this environment");
    }
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

    transitionTimeoutRef.current = window.setTimeout(() => {
        incrementArticleView(id);
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
      setView('ADMIN');
  };

  const handlePlayAudio = (article: Article) => {
    if (!article.audioUrl) return;
    if (audioState.articleId === article.id) {
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
      />

      <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        {/* RENDER SKELETONS BASED ON TARGET VIEW IF LOADING */}
        {isLoading ? (
             view === 'HOME' || view === 'ADMIN' ? (
                 /* Transitioning TO Article from Home, or TO Home from Article */
                 view === 'HOME' ? <ArticleSkeleton /> : <GridSkeleton />
             ) : (
                 /* If view is ARTICLE, and loading, we are likely going HOME */
                 <GridSkeleton />
             )
        ) : (
            <>
                {view === 'HOME' && (
                <div className="max-w-7xl mx-auto animate-fade-in">
                    
                    {/* Hero Section */}
                    {!searchQuery && activeCategory === 'All' && (
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
                                <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-300">View Archive</button>
                            </div>
                        )}

                        {displayArticles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
                                {displayArticles.map((article, idx) => {
                                    const coverMedia = article.media[0];
                                    const isVideo = coverMedia?.type === 'video';
                                    
                                    const isLarge = idx === 0 && !searchQuery && activeCategory === 'All';

                                    return (
                                        <div 
                                            key={article.id}
                                            onClick={() => handleArticleClick(article.id)}
                                            className={`group relative rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col ${isLarge ? 'md:col-span-2' : ''}`}
                                        >
                                            <div className="absolute inset-0 z-0 bg-slate-900">
                                                {isVideo ? (
                                                    <video 
                                                        src={coverMedia.src}
                                                        autoPlay loop muted playsInline
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

                {view === 'ARTICLE' && selectedArticleId && (
                <ArticleView 
                    article={allArticles.find(a => a.id === selectedArticleId)!} 
                    onBack={handleHomeClick}
                    onNavigate={handleArticleClick}
                    onPlayAudio={handlePlayAudio}
                    isPlayingCurrent={audioState.articleId === selectedArticleId}
                />
                )}

                {view === 'ADMIN' && (
                    <AdminEditor onClose={handleHomeClick} />
                )}
            </>
        )}
      </main>
      
      {!isLoading && <Footer />}

      <AudioPlayer 
        src={audioState.src} 
        title={audioState.title} 
        onClose={handleCloseAudio} 
      />
    </div>
  );
}

export default App;