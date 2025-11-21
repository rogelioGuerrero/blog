
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  caption?: string;
}

interface Props {
  media: MediaItem[];
}

const MediaCarousel: React.FC<Props> = ({ media }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const next = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  if (!media || media.length === 0) return null;

  const current = media[currentIndex];

  return (
    <div className="w-full mb-10 group/carousel">
      <div className="relative w-full bg-slate-100 dark:bg-slate-900 rounded-sm overflow-hidden shadow-sm">
        {/* Aspect Ratio Container */}
        <div className="aspect-[16/9] w-full relative">
            {current.type === 'video' ? (
                <video
                src={current.src}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
                />
            ) : (
                <img
                src={current.src}
                alt="Article Media"
                className="w-full h-full object-cover"
                />
            )}
        </div>
        
        {/* Minimal Controls - Visible on hover */}
        {media.length > 1 && (
            <>
            <button
                onClick={prev}
                className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-black/30"
            >
                <div className="p-2 bg-white/80 dark:bg-black/40 text-slate-900 dark:text-white rounded-full backdrop-blur-sm shadow-sm">
                    <ChevronLeft size={20} />
                </div>
            </button>
            <button
                onClick={next}
                className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-black/30"
            >
                <div className="p-2 bg-white/80 dark:bg-black/40 text-slate-900 dark:text-white rounded-full backdrop-blur-sm shadow-sm">
                    <ChevronRight size={20} />
                </div>
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {media.map((_, idx) => (
                    <div 
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${idx === currentIndex ? 'bg-white scale-110' : 'bg-white/50'}`}
                    />
                ))}
            </div>
            </>
        )}
      </div>

      {/* Clean Editorial Caption */}
      {current.caption && (
        <div className="mt-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-bold uppercase tracking-widest mb-1">Figure {currentIndex + 1}</p>
            <p className="text-sm font-serif text-slate-600 dark:text-slate-400 leading-relaxed italic max-w-3xl">
                {current.caption}
            </p>
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
