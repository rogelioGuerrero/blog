import React, { useState, useEffect } from 'react';
import { X, Settings, Sparkles, CheckCircle, AlertCircle, Clock, ChevronRight, Home } from 'lucide-react';
import { GeneratorInput } from './GeneratorInput';
import { GeneratorTextReview } from './GeneratorTextReview';
import { GeneratorMediaReview } from './GeneratorMediaReview';
import { GeneratorComplete } from './GeneratorComplete';
import { GeneratorSettings } from './GeneratorSettings';
import { SocialModal } from './SocialModal';
import { HistorySidebar } from './HistorySidebar';
import {
  GeneratorStep,
  GeneratedArticle,
  GeneratorConfig,
  GeneratorInputMode,
  GeneratorLanguage,
  ArticleLength,
  GeneratorAdvancedSettings,
  UploadedFile,
  getRegionPreferredDomains,
  GeneratorMediaItem,
  DEFAULT_ADVANCED_SETTINGS
} from '../../services/generator';
import {
  generateNewsContent,
  generateNewsImages,
  generateNewsAudio,
  setGeminiApiKey,
  hasGeminiApiKey
} from '../../services/generator/geminiService';
import {
  searchPexels,
  setPexelsApiKey,
  hasPexelsApiKey
} from '../../services/generator/pexelsService';
import { saveArticleToApi } from '../../services/api';
import { Article } from '../../types';

interface GeneratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleSaved: (article: Article) => void;
}

const STORAGE_KEY = 'blog_generator_config';
const HISTORY_KEY = 'blog_generator_history';
const MAX_HISTORY = 20;

const loadConfig = (): GeneratorConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load generator config', e);
  }
  return {
    geminiApiKey: '',
    pexelsApiKey: '',
    preferredDomains: getRegionPreferredDomains('world'),
    blockedDomains: []
  };
};

const saveConfig = (config: GeneratorConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

const loadHistory = (): GeneratedArticle[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load history', e);
  }
  return [];
};

const saveHistory = (history: GeneratedArticle[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
};

// Convert GeneratedArticle to Blog Article format
const convertToBlogArticle = (generated: GeneratedArticle): Omit<Article, 'id'> => {
  return {
    title: generated.title,
    excerpt: generated.metaDescription || generated.content.substring(0, 200) + '...',
    content: generated.content,
    media: generated.media.map(m => ({
      type: m.type,
      src: m.data.startsWith('http') || m.data.startsWith('data:') 
        ? m.data 
        : `data:${m.mimeType};base64,${m.data}`,
      caption: undefined
    })),
    audioUrl: generated.audioUrl,
    category: 'General',
    date: new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    author: 'Redacción',
    featured: false,
    readTime: Math.ceil(generated.content.split(/\s+/).length / 200),
    sources: generated.sources.map(s => s.uri).filter(u => u !== '#'),
    views: 0
  };
};

export const GeneratorPanel: React.FC<GeneratorPanelProps> = ({
  isOpen,
  onClose,
  onArticleSaved
}) => {
  const [step, setStep] = useState<GeneratorStep>(GeneratorStep.INPUT);
  const [article, setArticle] = useState<GeneratedArticle | null>(null);
  const [config, setConfig] = useState<GeneratorConfig>(loadConfig);
  const [advancedSettings, setAdvancedSettings] = useState<GeneratorAdvancedSettings>(DEFAULT_ADVANCED_SETTINGS);
  const [history, setHistory] = useState<GeneratedArticle[]>(loadHistory);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  
  // Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSearchingPexels, setIsSearchingPexels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Apply API keys when config changes
  useEffect(() => {
    if (config.geminiApiKey) {
      setGeminiApiKey(config.geminiApiKey);
    }
    if (config.pexelsApiKey) {
      setPexelsApiKey(config.pexelsApiKey);
    }
  }, [config]);

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setStep(GeneratorStep.INPUT);
      setArticle(null);
      setError(null);
      setSuccess(false);
      
      // Check if API keys are configured
      if (!config.geminiApiKey) {
        setShowSettings(true);
      }
    }
  }, [isOpen]);

  const handleSaveConfig = (newConfig: GeneratorConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
    setShowSettings(false);
  };

  // History functions
  const addToHistory = (art: GeneratedArticle) => {
    const newHistory = [art, ...history.filter(h => h.id !== art.id)].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    saveHistory(newHistory);
  };

  const handleLoadFromHistory = (art: GeneratedArticle) => {
    setArticle(art);
    setStep(GeneratorStep.COMPLETE);
    setShowHistory(false);
  };

  const handleDeleteFromHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    saveHistory(newHistory);
  };

  const handleClearHistory = () => {
    if (confirm('¿Eliminar todo el historial?')) {
      setHistory([]);
      saveHistory([]);
    }
  };

  const handleGenerate = async (
    input: string,
    mode: GeneratorInputMode,
    file: UploadedFile | null,
    language: GeneratorLanguage,
    length: ArticleLength,
    settings: GeneratorAdvancedSettings
  ) => {
    if (!hasGeminiApiKey()) {
      setError('Configura tu Gemini API Key primero');
      setShowSettings(true);
      return;
    }

    setError(null);
    setIsGenerating(true);
    setStatusMessage('Investigando fuentes y redactando...');

    try {
      const textData = await generateNewsContent(input, mode, file, language, length, settings);
      
      const partialArticle: GeneratedArticle = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        topic: mode === 'topic' ? input : file?.name || 'Documento',
        title: textData.title,
        content: textData.content,
        sources: textData.sources,
        rawSources: textData.rawSourceChunks,
        media: [],
        language,
        keywords: textData.keywords,
        metaDescription: textData.metaDescription,
        imagePrompt: textData.imagePrompt
      };
      
      setArticle(partialArticle);
      setAdvancedSettings(settings);
      setStep(GeneratorStep.TEXT_REVIEW);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error generando el artículo. Verifica tu API Key.');
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const handleConfirmText = async (updatedArticle: GeneratedArticle) => {
    setArticle(updatedArticle);
    setStep(GeneratorStep.MEDIA_REVIEW);
    
    if (updatedArticle.media.length > 0) return;

    setIsGeneratingImages(true);
    try {
      const [imageBytes, pexelsItems] = await Promise.all([
        generateNewsImages(updatedArticle.imagePrompt),
        hasPexelsApiKey() ? searchPexels(updatedArticle.keywords[0] || updatedArticle.topic, 'mixed', 2) : Promise.resolve([])
      ]);

      const aiMediaItems: GeneratorMediaItem[] = imageBytes.map(b => ({
        type: 'image',
        data: b,
        mimeType: 'image/jpeg'
      }));

      const combinedMedia = [...aiMediaItems, ...pexelsItems];
      setArticle(prev => prev ? { ...prev, media: combinedMedia } : null);
    } catch (e) {
      console.error("Error generating media:", e);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleRegenerateImages = async () => {
    if (!article) return;
    setIsGeneratingImages(true);
    try {
      const newImages = await generateNewsImages(article.imagePrompt);
      const newMediaItems: GeneratorMediaItem[] = newImages.map(b => ({
        type: 'image',
        data: b,
        mimeType: 'image/jpeg'
      }));
      setArticle(prev => prev ? { ...prev, media: [...prev.media, ...newMediaItems] } : null);
    } catch (e) {
      setError("Error regenerando imágenes.");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleSearchPexels = async (query: string) => {
    if (!hasPexelsApiKey()) {
      setError('Configura tu Pexels API Key para buscar imágenes');
      return;
    }
    
    setIsSearchingPexels(true);
    try {
      const items = await searchPexels(query, 'mixed', 4);
      setArticle(prev => prev ? { ...prev, media: [...prev.media, ...items] } : null);
    } catch (e) {
      setError("Error buscando en Pexels.");
    } finally {
      setIsSearchingPexels(false);
    }
  };

  // Move to Complete step (preview before publish)
  const handleMediaConfirm = (finalArticle: GeneratedArticle) => {
    setArticle(finalArticle);
    addToHistory(finalArticle);
    setStep(GeneratorStep.COMPLETE);
  };

  // Final publish to blog
  const handlePublish = async () => {
    if (!article) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const blogArticle = convertToBlogArticle(article);
      const saved = await saveArticleToApi(blogArticle as Article);
      setSuccess(true);
      onArticleSaved(saved);
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error saving article:', err);
      setError(err.message || 'Error guardando el artículo');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate audio for article
  const handleGenerateAudio = async () => {
    if (!article) return;
    
    setIsGeneratingAudio(true);
    try {
      const audioUrl = await generateNewsAudio(article.content, article.language, advancedSettings);
      setArticle(prev => prev ? { ...prev, audioUrl } : null);
      
      // Update in history too
      const updatedArticle = { ...article, audioUrl };
      addToHistory(updatedArticle);
    } catch (err: any) {
      console.error('Error generating audio:', err);
      setError('Error generando audio. Intenta de nuevo.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Generate social post content
  const handleGenerateSocialPost = async (platform: 'x' | 'linkedin' | 'facebook'): Promise<string> => {
    if (!article) return '';
    
    // Simple fallback - in production you'd call Gemini to generate platform-specific content
    const title = article.title;
    const keywords = article.keywords.slice(0, 3).map(k => `#${k.replace(/\s+/g, '')}`).join(' ');
    
    switch (platform) {
      case 'x':
        return `📰 ${title}\n\n${article.metaDescription.substring(0, 180)}...\n\n${keywords}`;
      case 'linkedin':
        return `🔔 ${title}\n\n${article.metaDescription}\n\n${article.content.substring(0, 500)}...\n\n${keywords}\n\n#Noticias #Actualidad`;
      case 'facebook':
        return `${title}\n\n${article.metaDescription}\n\n${article.content.substring(0, 800)}...\n\n${keywords}`;
      default:
        return title;
    }
  };

  // Reset to start
  const handleReset = () => {
    setStep(GeneratorStep.INPUT);
    setArticle(null);
    setError(null);
    setSuccess(false);
  };

  if (!isOpen) return null;

  const stepLabels: Record<GeneratorStep, string> = {
    [GeneratorStep.INPUT]: 'Tema',
    [GeneratorStep.TEXT_SEARCH]: 'Buscando...',
    [GeneratorStep.TEXT_REVIEW]: 'Texto',
    [GeneratorStep.MEDIA_REVIEW]: 'Media',
    [GeneratorStep.COMPLETE]: 'Vista Previa'
  };

  return (
    <>
      {/* Full Screen Panel */}
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-50 flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <Home size={18} />
                <span className="text-sm font-medium hidden sm:inline">Volver al Blog</span>
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white hidden sm:inline">Generador IA</span>
              </div>
            </div>

            {/* Center: Step Indicator */}
            <div className="hidden md:flex items-center gap-2">
              {[GeneratorStep.INPUT, GeneratorStep.TEXT_REVIEW, GeneratorStep.MEDIA_REVIEW, GeneratorStep.COMPLETE].map((s, idx) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    step === s 
                      ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                      : step > s 
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s 
                        ? 'bg-indigo-600 text-white' 
                        : step > s 
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }`}>
                      {step > s ? '✓' : idx + 1}
                    </span>
                    {stepLabels[s]}
                  </div>
                  {idx < 3 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />}
                </React.Fragment>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Clock size={16} />
                  <span className="hidden sm:inline">Historial</span>
                  <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-xs">
                    {history.length}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Configuración"
              >
                <Settings size={18} className="text-slate-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={`mx-auto py-6 px-4 ${step === GeneratorStep.COMPLETE ? 'max-w-6xl' : 'max-w-2xl'}`}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertCircle size={20} />
                <div className="flex-1">{error}</div>
                <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-6 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl flex items-center gap-4 text-green-700 dark:text-green-400">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">¡Artículo publicado exitosamente!</p>
                  <p className="text-sm opacity-80">El artículo ya está disponible en tu blog. Cerrando...</p>
                </div>
              </div>
            )}

            {/* Steps Content */}
            {!success && (
              <>
                {step === GeneratorStep.INPUT && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Redacción Periodística con IA
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400">
                        Genera artículos profundos, multimedia y multilingües en segundos.
                      </p>
                    </div>
                    <GeneratorInput
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                      statusMessage={statusMessage}
                    />
                  </div>
                )}

                {step === GeneratorStep.TEXT_REVIEW && article && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <GeneratorTextReview
                      article={article}
                      onBack={handleReset}
                      onConfirm={handleConfirmText}
                      isLoading={isGeneratingImages}
                    />
                  </div>
                )}

                {step === GeneratorStep.MEDIA_REVIEW && article && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <GeneratorMediaReview
                      article={article}
                      onBack={() => setStep(GeneratorStep.TEXT_REVIEW)}
                      onConfirm={handleMediaConfirm}
                      onRegenerateImages={handleRegenerateImages}
                      onSearchPexels={handleSearchPexels}
                      isGeneratingImages={isGeneratingImages}
                      isSearchingPexels={isSearchingPexels}
                    />
                  </div>
                )}

                {step === GeneratorStep.COMPLETE && article && (
                  <GeneratorComplete
                    article={article}
                    advancedSettings={advancedSettings}
                    onBack={() => setStep(GeneratorStep.MEDIA_REVIEW)}
                    onPublish={handlePublish}
                    onOpenSocial={() => setShowSocial(true)}
                    onGenerateAudio={handleGenerateAudio}
                    isPublishing={isSaving}
                    isGeneratingAudio={isGeneratingAudio}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <GeneratorSettings
        isOpen={showSettings}
        initialConfig={config}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveConfig}
      />

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onLoadArticle={handleLoadFromHistory}
        onDeleteArticle={handleDeleteFromHistory}
        onClearHistory={handleClearHistory}
      />

      {/* Social Modal */}
      {article && (
        <SocialModal
          isOpen={showSocial}
          onClose={() => setShowSocial(false)}
          article={article}
          onGeneratePost={handleGenerateSocialPost}
        />
      )}
    </>
  );
};
