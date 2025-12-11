import React, { useEffect } from 'react';
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
import { HeroSection, ArticleGrid, FilterResultsHeader, NoResults } from './components/home';
import { ArchiveView } from './components/archive';
import { useArticles, useNavigation, useFilters, useAudio, useSecretAccess, useMobile } from './hooks';

function App() {
  // Data & Settings
  const {
    articles,
    setArticles,
    settings,
    setSettings,
    isBootstrapping,
    dataVersion,
    setDataVersion,
    featuredArticle,
    incrementView,
  } = useArticles();

  // Navigation
  const {
    view,
    setView,
    selectedArticleId,
    isLoading,
    handleArticleClick,
    handleHomeClick,
    handleArchiveClick,
    handleDeepLink,
  } = useNavigation({
    articles,
    onIncrementView: incrementView,
    setDataVersion,
  });

  // Filters
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    displayArticles,
    archiveDateFilter,
    setArchiveDateFilter,
    archivePage,
    setArchivePage,
    archiveFilteredByDate,
    archivePageItems,
    archiveTotalPages,
    safeArchivePage,
    resetFilters,
  } = useFilters({ articles, featuredArticle });

  // Audio
  const { audioState, handlePlayAudio, handleCloseAudio, isPlayingArticle } = useAudio();

  // Secret Access
  const {
    showPinModal,
    showSecretMenu,
    showGenerator,
    handleSecretAccess,
    handlePinSuccess,
    handleSelectGenerator,
    handleSelectAdmin,
    handleCloseGenerator,
    handleClosePinModal,
    handleCloseSecretMenu,
    handleArticleSaved,
  } = useSecretAccess({ setView });

  // Mobile detection
  const isMobile = useMobile();

  // Layout
  const homeLayout = settings.homeLayout || 'hero_masonry';
  const isDefaultView = !searchQuery && activeCategory === 'All';

  // Deep linking on bootstrap
  useEffect(() => {
    if (isBootstrapping) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const sharedArticleId = params.get('articleId');
      if (sharedArticleId) {
        handleDeepLink(sharedArticleId, articles);
      }
    } catch (e) {
      console.log("URL parsing unavailable in this environment");
    }
  }, [isBootstrapping, articles, handleDeepLink]);

  // Reset filters on home click
  const handleHomeWithReset = () => {
    resetFilters();
    handleHomeClick();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors duration-300">
      
      <Navbar 
        onHome={handleHomeWithReset} 
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
            view === 'HOME' ? <ArticleSkeleton /> : <GridSkeleton />
          ) : (
            <GridSkeleton />
          )
        ) : (
          <>
            {/* HOME VIEW */}
            {view === 'HOME' && (
              <div className="max-w-7xl mx-auto animate-fade-in">
                {/* Hero Section */}
                {isDefaultView && featuredArticle && (
                  <HeroSection
                    article={featuredArticle}
                    onArticleClick={handleArticleClick}
                  />
                )}

                {/* Filter Results Header */}
                {!isDefaultView && (
                  <FilterResultsHeader
                    searchQuery={searchQuery}
                    activeCategory={activeCategory}
                    resultCount={displayArticles.length}
                  />
                )}

                {/* Article Grid */}
                <section>
                  {isDefaultView && (
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-serif">Latest Stories</h3>
                    </div>
                  )}
                  {displayArticles.length > 0 ? (
                    <ArticleGrid
                      articles={displayArticles}
                      layout={homeLayout}
                      onArticleClick={handleArticleClick}
                      isDefaultView={isDefaultView}
                    />
                  ) : (
                    <NoResults onClearFilters={handleHomeWithReset} />
                  )}
                </section>
              </div>
            )}

            {/* ARCHIVE VIEW */}
            {view === 'ARCHIVE' && (
              <ArchiveView
                articles={archiveFilteredByDate}
                pageItems={archivePageItems}
                totalCount={archiveFilteredByDate.length}
                currentPage={safeArchivePage}
                totalPages={archiveTotalPages}
                dateFilter={archiveDateFilter}
                onDateFilterChange={setArchiveDateFilter}
                onPageChange={setArchivePage}
                onArticleClick={handleArticleClick}
              />
            )}

            {/* ARTICLE VIEW */}
            {view === 'ARTICLE' && selectedArticleId && (
              (() => {
                const current = articles.find(a => a.id === selectedArticleId);
                if (!current) return null;
                const related = articles
                  .filter(a => a.category === current.category && a.id !== current.id)
                  .slice(0, 3);

                const hasVideo = current.media.some(m => m.type === 'video');
                const useVideoFirstLayout = isMobile && hasVideo;

                if (useVideoFirstLayout) {
                  return (
                    <ArticleViewVideoFirst
                      article={current}
                      onBack={handleHomeWithReset}
                      onNavigate={handleArticleClick}
                      onPlayAudio={handlePlayAudio}
                      isPlayingCurrent={isPlayingArticle(selectedArticleId)}
                      relatedArticles={related}
                      settings={settings}
                    />
                  );
                }

                return (
                  <ArticleView 
                    article={current} 
                    onBack={handleHomeWithReset}
                    onNavigate={handleArticleClick}
                    onPlayAudio={handlePlayAudio}
                    isPlayingCurrent={isPlayingArticle(selectedArticleId)}
                    relatedArticles={related}
                    settings={settings}
                  />
                );
              })()
            )}

            {/* ADMIN VIEW */}
            {view === 'ADMIN' && (
              <AdminEditor 
                onClose={handleHomeWithReset}
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
        onClose={handleClosePinModal}
        onSuccess={handlePinSuccess}
      />

      {/* Secret Menu - Choose Generator or Admin */}
      <SecretMenu
        isOpen={showSecretMenu}
        onClose={handleCloseSecretMenu}
        onSelectGenerator={handleSelectGenerator}
        onSelectAdmin={handleSelectAdmin}
      />

      {/* AI Article Generator Panel */}
      <GeneratorPanel
        isOpen={showGenerator}
        onClose={handleCloseGenerator}
        onArticleSaved={(article) => handleArticleSaved(article, setArticles, setDataVersion)}
      />
    </div>
  );
}

export default App;
