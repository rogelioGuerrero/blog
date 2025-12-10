import React, { useState, useEffect } from 'react';
import { X, Settings, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { GeneratorInput } from './GeneratorInput';
import { GeneratorTextReview } from './GeneratorTextReview';
import { GeneratorMediaReview } from './GeneratorMediaReview';
import { GeneratorSettings } from './GeneratorSettings';
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
  GeneratorMediaItem
} from '../../services/generator';
import {
  generateNewsContent,
  generateNewsImages,
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
  const [showSettings, setShowSettings] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
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

  const handleFinalConfirm = async (finalArticle: GeneratedArticle) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const blogArticle = convertToBlogArticle(finalArticle);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generador de Artículos</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {step === GeneratorStep.INPUT && 'Paso 1: Define el tema'}
                  {step === GeneratorStep.TEXT_REVIEW && 'Paso 2: Revisa el texto'}
                  {step === GeneratorStep.MEDIA_REVIEW && 'Paso 3: Selecciona medios'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Configuración"
              >
                <Settings size={20} className="text-slate-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
                <CheckCircle size={24} />
                <div>
                  <p className="font-bold">¡Artículo publicado!</p>
                  <p className="text-sm opacity-80">El artículo ya está disponible en tu blog.</p>
                </div>
              </div>
            )}

            {/* Steps */}
            {!success && (
              <>
                {step === GeneratorStep.INPUT && (
                  <GeneratorInput
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    statusMessage={statusMessage}
                  />
                )}

                {step === GeneratorStep.TEXT_REVIEW && article && (
                  <GeneratorTextReview
                    article={article}
                    onBack={() => setStep(GeneratorStep.INPUT)}
                    onConfirm={handleConfirmText}
                    isLoading={isGeneratingImages}
                  />
                )}

                {step === GeneratorStep.MEDIA_REVIEW && article && (
                  <GeneratorMediaReview
                    article={article}
                    onBack={() => setStep(GeneratorStep.TEXT_REVIEW)}
                    onConfirm={handleFinalConfirm}
                    onRegenerateImages={handleRegenerateImages}
                    onSearchPexels={handleSearchPexels}
                    isGeneratingImages={isGeneratingImages}
                    isSearchingPexels={isSearchingPexels}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <GeneratorSettings
        isOpen={showSettings}
        initialConfig={config}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveConfig}
      />
    </>
  );
};
