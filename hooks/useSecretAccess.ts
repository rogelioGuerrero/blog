import { useState, useCallback } from 'react';
import { ViewState, Article } from '../types';

interface UseSecretAccessProps {
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
}

interface UseSecretAccessReturn {
  showPinModal: boolean;
  showSecretMenu: boolean;
  showGenerator: boolean;
  handleSecretAccess: () => void;
  handlePinSuccess: () => void;
  handleSelectGenerator: () => void;
  handleSelectAdmin: () => void;
  handleCloseGenerator: () => void;
  handleClosePinModal: () => void;
  handleCloseSecretMenu: () => void;
  handleArticleSaved: (savedArticle: Article, setArticles: React.Dispatch<React.SetStateAction<Article[]>>, setDataVersion: React.Dispatch<React.SetStateAction<number>>) => void;
}

export function useSecretAccess({ setView }: UseSecretAccessProps): UseSecretAccessReturn {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSecretMenu, setShowSecretMenu] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleSecretAccess = useCallback(() => {
    setShowPinModal(true);
  }, []);

  const handlePinSuccess = useCallback(() => {
    setShowPinModal(false);
    setShowSecretMenu(true);
  }, []);

  const handleSelectGenerator = useCallback(() => {
    setShowSecretMenu(false);
    setShowGenerator(true);
  }, []);

  const handleSelectAdmin = useCallback(() => {
    setShowSecretMenu(false);
    setView('ADMIN');
  }, [setView]);

  const handleCloseGenerator = useCallback(() => {
    setShowGenerator(false);
  }, []);

  const handleClosePinModal = useCallback(() => {
    setShowPinModal(false);
  }, []);

  const handleCloseSecretMenu = useCallback(() => {
    setShowSecretMenu(false);
  }, []);

  const handleArticleSaved = useCallback((
    savedArticle: Article,
    setArticles: React.Dispatch<React.SetStateAction<Article[]>>,
    setDataVersion: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setArticles(prev => [savedArticle, ...prev.filter(a => a.id !== savedArticle.id)]);
    setDataVersion(v => v + 1);
  }, []);

  return {
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
  };
}
