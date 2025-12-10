import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  Search,
  Upload,
  Loader2,
  RefreshCw,
  GripVertical
} from 'lucide-react';
import { GeneratedArticle, GeneratorMediaItem } from '../../services/generator';

interface GeneratorMediaReviewProps {
  article: GeneratedArticle;
  onBack: () => void;
  onConfirm: (article: GeneratedArticle) => void;
  onRegenerateImages: () => void;
  onSearchPexels: (query: string) => void;
  isGeneratingImages: boolean;
  isSearchingPexels: boolean;
}

const getMediaSrc = (item: GeneratorMediaItem): string => {
  if (item.data.startsWith('http') || item.data.startsWith('data:')) {
    return item.data;
  }
  return `data:${item.mimeType};base64,${item.data}`;
};

export const GeneratorMediaReview: React.FC<GeneratorMediaReviewProps> = ({
  article,
  onBack,
  onConfirm,
  onRegenerateImages,
  onSearchPexels,
  isGeneratingImages,
  isSearchingPexels
}) => {
  const [media, setMedia] = useState<GeneratorMediaItem[]>(article.media);
  const [pexelsQuery, setPexelsQuery] = useState(article.keywords[0] || article.topic);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const mediaUploadRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleRemoveMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    setMedia(newMedia);
    if (selectedIndex >= newMedia.length) {
      setSelectedIndex(Math.max(0, newMedia.length - 1));
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo es muy grande (Máx 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = (evt.target?.result as string).split(',')[1];
      const isVideo = file.type.startsWith('video/');
      const newItem: GeneratorMediaItem = {
        type: isVideo ? 'video' : 'image',
        data: base64,
        mimeType: file.type
      };
      setMedia([...media, newItem]);
    };
    reader.readAsDataURL(file);
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const newMedia = [...media];
    const draggedItem = newMedia[dragItem.current];
    newMedia.splice(dragItem.current, 1);
    newMedia.splice(dragOverItem.current, 0, draggedItem);
    
    setMedia(newMedia);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSearchPexelsClick = () => {
    if (pexelsQuery.trim()) {
      onSearchPexels(pexelsQuery);
    }
  };

  const handleConfirm = () => {
    onConfirm({ ...article, media });
  };

  // Sync media when article changes (e.g., after Pexels search)
  React.useEffect(() => {
    setMedia(article.media);
  }, [article.media]);

  const currentMedia = media[selectedIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al texto
        </button>
        <span className="text-xs text-slate-400">{media.length} elementos</span>
      </div>

      {/* Main Preview */}
      <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
        {currentMedia ? (
          currentMedia.type === 'video' ? (
            <video
              src={getMediaSrc(currentMedia)}
              className="w-full h-full object-contain"
              controls
              autoPlay
              muted
              loop
            />
          ) : (
            <img
              src={getMediaSrc(currentMedia)}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin medios</p>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {media.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => setSelectedIndex(idx)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${
                selectedIndex === idx
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'border-transparent hover:border-slate-400'
              }`}
            >
              <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} className="text-white drop-shadow" />
              </div>
              {item.type === 'video' ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <Video size={24} className="text-slate-400" />
                </div>
              ) : (
                <img
                  src={getMediaSrc(item)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMedia(idx);
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRegenerateImages}
          disabled={isGeneratingImages}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isGeneratingImages ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Regenerar IA
        </button>
        <button
          onClick={() => mediaUploadRef.current?.click()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload size={16} />
          Subir
        </button>
        <input
          ref={mediaUploadRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Pexels Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={pexelsQuery}
          onChange={(e) => setPexelsQuery(e.target.value)}
          placeholder="Buscar en Pexels..."
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSearchPexelsClick()}
        />
        <button
          onClick={handleSearchPexelsClick}
          disabled={isSearchingPexels || !pexelsQuery.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
        >
          {isSearchingPexels ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </button>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleConfirm}
        disabled={media.length === 0}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 disabled:shadow-none transition-all flex items-center justify-center gap-2"
      >
        Finalizar y Publicar
        <ArrowRight size={20} />
      </button>
    </div>
  );
};
