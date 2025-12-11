import { useState, useCallback } from 'react';
import { Article } from '../types';

interface AudioState {
  src: string | null;
  title: string | null;
  articleId: string | null;
}

interface UseAudioReturn {
  audioState: AudioState;
  handlePlayAudio: (article: Article) => void;
  handleCloseAudio: () => void;
  isPlayingArticle: (articleId: string) => boolean;
}

export function useAudio(): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>({
    src: null,
    title: null,
    articleId: null,
  });

  const handlePlayAudio = useCallback((article: Article) => {
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
      articleId: article.id,
    });
  }, [audioState.articleId]);

  const handleCloseAudio = useCallback(() => {
    setAudioState({ src: null, title: null, articleId: null });
  }, []);

  const isPlayingArticle = useCallback((articleId: string) => {
    return audioState.articleId === articleId;
  }, [audioState.articleId]);

  return {
    audioState,
    handlePlayAudio,
    handleCloseAudio,
    isPlayingArticle,
  };
}
