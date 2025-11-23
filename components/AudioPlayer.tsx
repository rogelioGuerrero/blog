
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, X, Volume2, SkipBack, SkipForward } from 'lucide-react';

interface AudioPlayerProps {
  src: string | null;
  title: string | null;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (src && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay prevented", e));
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!src) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4 animate-fade-in">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full p-3 pr-6 shadow-2xl shadow-slate-300/50 dark:shadow-black/50 flex items-center gap-4 w-full max-w-lg transition-colors duration-300">
        {/* Vinyl/Icon Effect */}
        <div className={`w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}>
            <Volume2 size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-indigo-200 truncate max-w-[200px]">{title}</h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                {audioRef.current ? formatTime(audioRef.current.currentTime) : "00:00"} / {formatTime(duration)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div 
            className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer overflow-hidden group"
            onClick={(e) => {
                if(!audioRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const newTime = (x / rect.width) * audioRef.current.duration;
                audioRef.current.currentTime = newTime;
            }}
          >
            <div 
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full relative" 
                style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                <SkipBack size={16} />
            </button>
            <button 
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-colors shadow-md"
            >
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
            <button className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                <SkipForward size={16} />
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <X size={16} />
            </button>
        </div>

        <audio 
          ref={audioRef} 
          src={src} 
          onTimeUpdate={handleTimeUpdate} 
          onEnded={() => setIsPlaying(false)} 
          onError={(e) => {
            console.error('Audio failed to load', e);
            setIsPlaying(false);
            onClose();
          }}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
