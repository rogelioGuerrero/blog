import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Code, 
  Volume2, 
  ChevronLeft, 
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Play,
  Pause,
  FileJson,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Globe,
  ExternalLink
} from 'lucide-react';
import { GeneratedArticle, GeneratorMediaItem, GeneratorAdvancedSettings } from '../../services/generator';

interface GeneratorCompleteProps {
  article: GeneratedArticle;
  advancedSettings: GeneratorAdvancedSettings;
  onBack: () => void;
  onPublish: () => void;
  onOpenSocial: () => void;
  onGenerateAudio: () => void;
  isPublishing: boolean;
  isGeneratingAudio: boolean;
}

const getMediaSrc = (item: GeneratorMediaItem): string => {
  if (item.data.startsWith('http') || item.data.startsWith('data:')) {
    return item.data;
  }
  return `data:${item.mimeType};base64,${item.data}`;
};

export const GeneratorComplete: React.FC<GeneratorCompleteProps> = ({
  article,
  advancedSettings,
  onBack,
  onPublish,
  onOpenSocial,
  onGenerateAudio,
  isPublishing,
  isGeneratingAudio
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Auto-play videos when they become active
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === currentMediaIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentMediaIndex]);

  const handlePrevMedia = () => {
    setCurrentMediaIndex(prev => prev === 0 ? article.media.length - 1 : prev - 1);
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex(prev => prev === article.media.length - 1 ? 0 : prev + 1);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(article, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `article-${article.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMedia = (item: GeneratorMediaItem, index: number) => {
    const src = getMediaSrc(item);
    const a = document.createElement('a');
    a.href = src;
    a.download = `media-${index + 1}.${item.mimeType.split('/')[1] || 'jpg'}`;
    a.click();
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const generateEmbedCode = () => {
    const mediaSrc = article.media[0] ? getMediaSrc(article.media[0]) : '';
    return `<article class="generated-article">
  <img src="${mediaSrc}" alt="${article.title}" style="width:100%;border-radius:8px;">
  <h1>${article.title}</h1>
  <p>${article.metaDescription}</p>
  <div>${article.content.substring(0, 500)}...</div>
  <footer>
    <small>Fuentes: ${article.sources.map(s => s.title).join(', ')}</small>
  </footer>
</article>`;
  };

  // Group sources by domain
  const groupedSources = article.sources.reduce<Record<string, typeof article.sources>>((acc, src) => {
    try {
      const domain = new URL(src.uri).hostname.replace('www.', '');
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(src);
    } catch {
      if (!acc['other']) acc['other'] = [];
      acc['other'].push(src);
    }
    return acc;
  }, {});

  const currentMedia = article.media[currentMediaIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Editar medios
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock size={14} />
          {new Date(article.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Preview */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Media Carousel */}
          {article.media.length > 0 && (
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group">
              {article.media.map((item, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    idx === currentMediaIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  {item.type === 'video' ? (
                    <video
                      ref={(el) => { videoRefs.current[idx] = el; }}
                      src={getMediaSrc(item)}
                      className="w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={getMediaSrc(item)}
                      alt={`Media ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
              ))}

              {/* Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="flex gap-2 mb-3">
                  <span className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    {article.keywords[0] || 'Artículo'}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                    {article.language.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight drop-shadow-lg">
                  {article.title}
                </h1>
              </div>

              {/* Navigation Arrows */}
              {article.media.length > 1 && (
                <>
                  <button
                    onClick={handlePrevMedia}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextMedia}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  {/* Dots */}
                  <div className="absolute bottom-3 right-3 z-30 flex gap-1.5">
                    {article.media.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentMediaIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentMediaIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Download current media */}
              {currentMedia && (
                <button
                  onClick={() => handleDownloadMedia(currentMedia, currentMediaIndex)}
                  className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Descargar imagen"
                >
                  <Download size={16} />
                </button>
              )}
            </div>
          )}

          {/* Audio Player */}
          {article.audioUrl ? (
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center gap-4">
              <button
                onClick={toggleAudio}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-colors"
              >
                {isPlayingAudio ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              </button>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Audio del artículo</div>
                <div className="text-xs text-slate-500">Generado con IA • Voz natural</div>
              </div>
              <audio ref={audioRef} src={article.audioUrl} onEnded={() => setIsPlayingAudio(false)} />
            </div>
          ) : (
            <button
              onClick={onGenerateAudio}
              disabled={isGeneratingAudio}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 size={20} className="animate-spin text-indigo-600" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Generando audio...</span>
                </>
              ) : (
                <>
                  <Volume2 size={20} className="text-indigo-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Generar Audio con IA</span>
                </>
              )}
            </button>
          )}

          {/* Article Content Preview */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-h-80 overflow-y-auto">
            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
              {article.content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('###')) {
                  return (
                    <h3 key={i} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">
                      {trimmed.replace(/^###\s*/, '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('##')) {
                  return (
                    <h2 key={i} className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">
                      {trimmed.replace(/^##\s*/, '')}
                    </h2>
                  );
                }
                if (!trimmed) return null;
                return (
                  <p key={i} className="text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Sources */}
          {Object.keys(groupedSources).length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-slate-400" />
                <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                  Fuentes ({article.sources.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(groupedSources).map(([domain, sources]) => (
                  <a
                    key={domain}
                    href={sources[0].uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {domain}
                    {sources.length > 1 && (
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 rounded-full text-[10px]">
                        {sources.length}
                      </span>
                    )}
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-4">
          {/* Publish Button */}
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {isPublishing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Publicar en el Blog
              </>
            )}
          </button>

          {/* Action Cards */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Acciones</h3>
            
            <button
              onClick={onOpenSocial}
              className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Share2 size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">Social Studio</div>
                <div className="text-xs text-slate-500">Generar posts para redes</div>
              </div>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileJson size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">Descargar JSON</div>
                <div className="text-xs text-slate-500">Exportar datos del artículo</div>
              </div>
            </button>

            <button
              onClick={() => setShowEmbedCode(!showEmbedCode)}
              className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Code size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">Código Embed</div>
                <div className="text-xs text-slate-500">HTML para tu sitio web</div>
              </div>
            </button>
          </div>

          {/* Embed Code Panel */}
          {showEmbedCode && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Código HTML</span>
                <button
                  onClick={() => handleCopy(generateEmbedCode(), 'embed')}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {copied === 'embed' ? <Check size={12} /> : <Copy size={12} />}
                  {copied === 'embed' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <pre className="text-xs text-indigo-300 font-mono overflow-x-auto p-3 bg-slate-950 rounded-lg max-h-40">
                {generateEmbedCode()}
              </pre>
            </div>
          )}

          {/* AI Details */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-3">Detalles de IA</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Modelo</span>
                <span className="text-slate-900 dark:text-white font-medium">Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tono</span>
                <span className="text-slate-900 dark:text-white font-medium capitalize">{advancedSettings.tone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Audiencia</span>
                <span className="text-slate-900 dark:text-white font-medium capitalize">{advancedSettings.audience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Región</span>
                <span className="text-slate-900 dark:text-white font-medium capitalize">{advancedSettings.sourceRegion}</span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {article.keywords.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-3">Keywords</h4>
              <div className="flex flex-wrap gap-1.5">
                {article.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Media Thumbnails */}
          {article.media.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                  Media ({article.media.length})
                </h4>
                <ImageIcon size={14} className="text-slate-400" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {article.media.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMediaIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentMediaIndex
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                        <Play size={16} className="text-slate-400" />
                      </div>
                    ) : (
                      <img
                        src={getMediaSrc(item)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
