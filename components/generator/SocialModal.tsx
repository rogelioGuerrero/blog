import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Loader2, 
  ExternalLink,
  Twitter,
  Linkedin,
  Facebook,
  Download
} from 'lucide-react';
import { GeneratedArticle, GeneratorMediaItem } from '../../services/generator';

interface SocialModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: GeneratedArticle;
  onGeneratePost: (platform: SocialPlatform) => Promise<string>;
}

type SocialPlatform = 'x' | 'linkedin' | 'facebook';

const getMediaSrc = (item: GeneratorMediaItem): string => {
  if (item.data.startsWith('http') || item.data.startsWith('data:')) {
    return item.data;
  }
  return `data:${item.mimeType};base64,${item.data}`;
};

const PLATFORM_CONFIG = {
  x: {
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-black',
    maxLength: 280,
    shareUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-[#0A66C2]',
    maxLength: 3000,
    shareUrl: (text: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(text)}`
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-[#1877F2]',
    maxLength: 63206,
    shareUrl: (text: string) => `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`
  }
};

export const SocialModal: React.FC<SocialModalProps> = ({
  isOpen,
  onClose,
  article,
  onGeneratePost
}) => {
  const [platform, setPlatform] = useState<SocialPlatform>('x');
  const [contentMap, setContentMap] = useState<Record<SocialPlatform, string>>({
    x: '',
    linkedin: '',
    facebook: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate content when platform changes or modal opens
  useEffect(() => {
    if (isOpen && !contentMap[platform]) {
      handleGenerate();
    }
  }, [isOpen, platform]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const content = await onGeneratePost(platform);
      setContentMap(prev => ({ ...prev, [platform]: content }));
    } catch (error) {
      console.error('Error generating social post:', error);
      // Fallback content
      const fallback = generateFallbackContent(platform);
      setContentMap(prev => ({ ...prev, [platform]: fallback }));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackContent = (p: SocialPlatform): string => {
    const title = article.title;
    const keywords = article.keywords.slice(0, 3).map(k => `#${k.replace(/\s+/g, '')}`).join(' ');
    
    switch (p) {
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

  const handleCopy = () => {
    navigator.clipboard.writeText(contentMap[platform]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMedia = (item: GeneratorMediaItem, index: number) => {
    const src = getMediaSrc(item);
    const a = document.createElement('a');
    a.href = src;
    a.download = `social-media-${index + 1}.${item.mimeType.split('/')[1] || 'jpg'}`;
    a.click();
  };

  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  const currentContent = contentMap[platform];
  const charCount = currentContent.length;
  const isOverLimit = charCount > config.maxLength;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Social Studio AI</h3>
              <p className="text-xs text-slate-500">Genera posts optimizados para cada red</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {(Object.keys(PLATFORM_CONFIG) as SocialPlatform[]).map(p => {
            const cfg = PLATFORM_CONFIG[p];
            const PIcon = cfg.icon;
            return (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                  platform === p
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <PIcon size={16} />
                {cfg.name}
                {platform === p && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
              <p className="text-sm text-slate-500">Generando contenido para {config.name}...</p>
            </div>
          ) : (
            <>
              {/* Generated Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    Texto Generado
                  </label>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    <RefreshCw size={12} />
                    Regenerar
                  </button>
                </div>
                <textarea
                  value={currentContent}
                  onChange={(e) => setContentMap(prev => ({ ...prev, [platform]: e.target.value }))}
                  className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="El contenido aparecerá aquí..."
                />
                <div className="flex justify-between text-xs">
                  <span className={isOverLimit ? 'text-red-500 font-medium' : 'text-slate-400'}>
                    {charCount} / {config.maxLength} caracteres
                  </span>
                  {isOverLimit && (
                    <span className="text-red-500">Excede el límite de {config.name}</span>
                  )}
                </div>
              </div>

              {/* Media to Attach */}
              {article.media.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    Media para Adjuntar
                  </label>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {article.media.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group"
                      >
                        {item.type === 'video' ? (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                            Video
                          </div>
                        ) : (
                          <img
                            src={getMediaSrc(item)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          onClick={() => handleDownloadMedia(item, idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Download size={20} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    * Descarga las imágenes para adjuntarlas manualmente en tu publicación.
                  </p>
                </div>
              )}

              {/* Tips */}
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4">
                <h4 className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  Tips para {config.name}
                </h4>
                <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                  {platform === 'x' && (
                    <>
                      <li>• Usa hashtags relevantes (2-3 máximo)</li>
                      <li>• Incluye una imagen para mayor engagement</li>
                      <li>• Haz preguntas para generar interacción</li>
                    </>
                  )}
                  {platform === 'linkedin' && (
                    <>
                      <li>• Comienza con un hook que capture atención</li>
                      <li>• Usa espacios entre párrafos para legibilidad</li>
                      <li>• Incluye un call-to-action al final</li>
                    </>
                  )}
                  {platform === 'facebook' && (
                    <>
                      <li>• Los posts con imágenes tienen 2.3x más engagement</li>
                      <li>• Usa emojis con moderación</li>
                      <li>• Invita a comentar o compartir</li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={handleCopy}
            disabled={!currentContent}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar Texto'}
          </button>
          <a
            href={config.shareUrl(currentContent)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2.5 ${config.color} text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-bold`}
          >
            Abrir {config.name}
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
