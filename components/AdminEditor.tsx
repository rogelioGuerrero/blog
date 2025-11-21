import React, { useState, useRef, useEffect } from 'react';

import { Save, Image as ImageIcon, X, Wand2, Upload, Link as LinkIcon, FileJson, CheckCircle2, AlertCircle, Settings, Layout, Plus, Trash2, PenTool, Tag, FileText, List, Mail, AlignLeft, Eye, Globe, GripVertical } from 'lucide-react';

import { normalizeArticle, getSettings, AppSettings, getArticles } from '../services/data';
import { getArticlesFromApi, getSettingsFromApi, saveArticleToApi, saveSettingsToApi, deleteArticleFromApi, renameCategoryInApi } from '../services/api';

import { Article } from '../types';
import { searchMedia } from '../services/pexels';

interface Props {
  onClose: () => void;
  onSettingsUpdated?: (settings: AppSettings) => void;
  onArticlesUpdated?: (articles: Article[]) => void;
}

type Tab = 'IMPORT' | 'CONFIG' | 'MANAGE';

const AdminEditor: React.FC<Props> = ({ onClose, onSettingsUpdated, onArticlesUpdated }) => {
  const [activeTab, setActiveTab] = useState<Tab>('IMPORT');
  
  // -- Config State (Loaded first to populate dropdowns) --
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const [newCategory, setNewCategory] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // -- Manage State --
  const [articleList, setArticleList] = useState(getArticles());

  // -- Import State --
  const [jsonInput, setJsonInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(settings.navCategories[0] || 'General');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  const [isFooterLinksOpen, setIsFooterLinksOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);
  const [draggedFooterLinkIndex, setDraggedFooterLinkIndex] = useState<number | null>(null);
  const [dragOverFooterLinkIndex, setDragOverFooterLinkIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load latest settings and articles from API on mount (fallback a la capa local si falla)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [remoteSettings, remoteArticles] = await Promise.all([
          getSettingsFromApi(),
          getArticlesFromApi(),
        ]);

        if (cancelled) return;

        setSettings(remoteSettings);
        setArticleList(remoteArticles);
        if (remoteSettings.navCategories.length > 0) {
          setSelectedCategory(remoteSettings.navCategories[0]);
        }
      } catch (e) {
        console.error('Failed to load admin data from API, using local storage / defaults instead', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Helper to try and auto-match category from JSON
  const tryAutoSelectCategory = (jsonString: string) => {
      try {
          const parsed = JSON.parse(jsonString);
          const candidate = parsed.article?.category || parsed.category;
          if (candidate && settings.navCategories.includes(candidate)) {
              setSelectedCategory(candidate);
          }
      } catch (e) {
          // Ignore parsing errors at this stage
      }
  };

  // --- IMPORT HANDLERS ---

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setJsonInput(text);
        tryAutoSelectCategory(text);
        setStatus({ type: 'success', message: `Loaded file: ${file.name}` });
      }
    };
    reader.readAsText(file);
  };

  const handleUrlFetch = async () => {
      if (!urlInput) return;
      setIsProcessing(true);
      setStatus({ type: 'info', message: 'Fetching from URL...' });
      
      try {
          const res = await fetch(urlInput);
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          const text = JSON.stringify(data, null, 2);
          setJsonInput(text);
          tryAutoSelectCategory(text);
          setStatus({ type: 'success', message: 'JSON loaded from URL' });
      } catch (e) {
          setStatus({ type: 'error', message: 'Could not fetch JSON. Check CORS or URL.' });
      } finally {
          setIsProcessing(false);
      }
  };

  const handleProcessAndPublish = async () => {
    if (!jsonInput.trim()) return;

    setIsProcessing(true);
    setStatus({ type: 'info', message: 'Parsing JSON...' });

    try {
      let rawData: any;
      rawData = JSON.parse(jsonInput);

      const articleData = rawData.article ? rawData.article : rawData;

      // OVERRIDE CATEGORY with the one selected in UI
      articleData.category = selectedCategory;

      const article = normalizeArticle(articleData);

      setStatus({ type: 'info', message: 'Connecting to Pexels API...' });

      const enhancedMedia: any[] = [];
      const existingMedia = article.media.length > 0 ? article.media : [{ type: 'image', src: '' }];

      for (const item of existingMedia) {
        if (!item.src || item.src.length < 5) {
          setStatus({ type: 'info', message: `Fetching ${item.type} for "${article.title}"...` });
          const mediaResult = await searchMedia(
            `${article.title} ${article.category}`,
            item.type as 'image' | 'video'
          );

          if (mediaResult) {
            enhancedMedia.push({
              type: item.type,
              src: mediaResult.src,
              caption: mediaResult.caption,
            });
          } else {
            enhancedMedia.push(item);
          }
        } else {
          enhancedMedia.push(item);
        }
      }

      article.media = enhancedMedia as any;

      const saved = await saveArticleToApi(article);
      const updatedList = await getArticlesFromApi();
      setArticleList(updatedList);
      if (onArticlesUpdated) {
        onArticlesUpdated(updatedList);
      }
      setStatus({ type: 'success', message: 'Article Published Successfully!' });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setStatus({ type: 'error', message: 'Invalid JSON syntax' });
      } else {
        console.error(err);
        setStatus({ type: 'error', message: 'An unexpected error occurred.' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CONFIG HANDLERS ---

  const handleAddCategory = () => {
      if (!newCategory.trim()) return;
      // Avoid duplicates
      if (settings.navCategories.includes(newCategory.trim())) {
          setNewCategory('');
          return;
      }
      
      const updatedSettings = {
          ...settings,
          navCategories: [...settings.navCategories, newCategory.trim()]
      };
      setSettings(updatedSettings);
      // If this is the first category, select it for import
      if (settings.navCategories.length === 0) {
          setSelectedCategory(newCategory.trim());
      }
      setNewCategory('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
      const updatedSettings = {
          ...settings,
          navCategories: settings.navCategories.filter(c => c !== catToRemove)
      };
      setSettings(updatedSettings);
      // If we removed the currently selected one, reset to first available
      if (selectedCategory === catToRemove) {
          setSelectedCategory(updatedSettings.navCategories[0] || '');
      }
  };

  const handleCategoryDragStart = (index: number) => {
      setDraggedCategoryIndex(index);
  };

  const handleCategoryDragEnter = (index: number) => {
      if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;
      setDragOverCategoryIndex(index);
  };

  const handleCategoryDrop = (index: number) => {
      if (draggedCategoryIndex === null || draggedCategoryIndex === index) {
          setDraggedCategoryIndex(null);
          setDragOverCategoryIndex(null);
          return;
      }

      setSettings((prevSettings) => {
          const updated = [...prevSettings.navCategories];
          const [moved] = updated.splice(draggedCategoryIndex, 1);
          updated.splice(index, 0, moved);
          return { ...prevSettings, navCategories: updated };
      });

      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
  };

  const handleRenameCategory = async (catToRename: string) => {
      const proposed = window.prompt('Rename category', catToRename);
      if (!proposed) return;
      const trimmed = proposed.trim();
      if (!trimmed || trimmed === catToRename) return;
      if (settings.navCategories.includes(trimmed)) {
          setStatus({ type: 'error', message: 'A category with that name already exists.' });
          setTimeout(() => setStatus(null), 2000);
          return;
      }

      setIsProcessing(true);
      setStatus({ type: 'info', message: 'Renaming category…' });

      try {
          const updatedSettings = await renameCategoryInApi(catToRename, trimmed);
          setSettings(updatedSettings);
          if (onSettingsUpdated) {
              onSettingsUpdated(updatedSettings);
          }
          if (selectedCategory === catToRename) {
              setSelectedCategory(trimmed);
          }

          const updatedArticles = await getArticlesFromApi();
          setArticleList(updatedArticles);
          if (onArticlesUpdated) {
              onArticlesUpdated(updatedArticles);
          }

          setStatus({ type: 'success', message: 'Category renamed successfully.' });
          setTimeout(() => setStatus(null), 2000);
      } catch (e: any) {
          console.error('Rename category error:', e);
          setStatus({ type: 'error', message: e.message || 'Failed to rename category.' });
      } finally {
          setIsProcessing(false);
      }
  };

  const handleAddLink = () => {
      if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
      
      const updatedSettings = {
          ...settings,
          footerLinks: [...settings.footerLinks, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }]
      };
      setSettings(updatedSettings);
      setNewLinkLabel('');
      setNewLinkUrl('');
  };

  const handleRemoveLink = (index: number) => {
      const updatedSettings = {
          ...settings,
          footerLinks: settings.footerLinks.filter((_, i) => i !== index)
      };
      setSettings(updatedSettings);
  };

  const handleFooterLinkDragStart = (index: number) => {
      setDraggedFooterLinkIndex(index);
  };

  const handleFooterLinkDragEnter = (index: number) => {
      if (draggedFooterLinkIndex === null || draggedFooterLinkIndex === index) return;
      setDragOverFooterLinkIndex(index);
  };

  const handleFooterLinkDrop = (index: number) => {
      if (draggedFooterLinkIndex === null || draggedFooterLinkIndex === index) {
          setDraggedFooterLinkIndex(null);
          setDragOverFooterLinkIndex(null);
          return;
      }

      setSettings((prevSettings) => {
          const updated = [...prevSettings.footerLinks];
          const [moved] = updated.splice(draggedFooterLinkIndex, 1);
          updated.splice(index, 0, moved);
          return { ...prevSettings, footerLinks: updated };
      });

      setDraggedFooterLinkIndex(null);
      setDragOverFooterLinkIndex(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setSettings({...settings, logoUrl: base64});
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveSettings = async () => {
      try {
        const saved = await saveSettingsToApi(settings);
        setSettings(saved);
        if (onSettingsUpdated) {
          onSettingsUpdated(saved);
        }
        setStatus({ type: 'success', message: 'Configuration Saved!' });
        setTimeout(() => setStatus(null), 2000);
      } catch (e: any) {
        setStatus({ type: 'error', message: e.message || 'Failed to save settings' });
      }
  };

  // --- MANAGE HANDLERS ---
  const handleDeleteArticle = async (id: string) => {
      if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
          try {
              await deleteArticleFromApi(id);
              // Force a fresh read from the source of truth to ensure UI sync
              const updatedList = await getArticlesFromApi();
              setArticleList([...updatedList]); 
              if (onArticlesUpdated) {
                onArticlesUpdated(updatedList);
              }
              setStatus({ type: 'success', message: 'Article deleted.' });
              setTimeout(() => setStatus(null), 2000);
          } catch (e) {
              console.error("Delete error:", e);
              setStatus({ type: 'error', message: 'Failed to delete article.' });
          }
      }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 animate-fade-in bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm fixed inset-0 z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl transition-colors duration-300 overflow-hidden flex flex-col min-h-[600px]">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10">
                    <Layout className="text-slate-600 dark:text-slate-300" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Console</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage content and platform settings.</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-full transition-all">
                <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-white/5 px-8 overflow-x-auto no-scrollbar">
             <button 
                onClick={() => setActiveTab('IMPORT')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'IMPORT' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                    : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
             >
                <Wand2 size={16} /> Import Content
             </button>
             <button 
                onClick={() => setActiveTab('MANAGE')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'MANAGE' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                    : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
             >
                <List size={16} /> Manage Content
             </button>
             <button 
                onClick={() => setActiveTab('CONFIG')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'CONFIG' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                    : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
             >
                <Settings size={16} /> Site Config
             </button>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8 flex-1 bg-slate-50/50 dark:bg-black/20">
            
            {/* === TAB: IMPORT === */}
            {activeTab === 'IMPORT' && (
                <div className="animate-fade-in space-y-6">
                     {/* Input Methods Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Method 1: File Upload */}
                        <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-indigo-200 dark:hover:border-white/10 transition-colors shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <FileJson size={16} /> Upload JSON File
                            </h3>
                            <input 
                                type="file" 
                                accept=".json" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileSelect}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-2 px-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <Upload size={16} /> Select File from PC
                            </button>
                        </div>

                        {/* Method 2: URL Fetch */}
                        <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-indigo-200 dark:hover:border-white/10 transition-colors shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <LinkIcon size={16} /> Load from URL
                            </h3>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://api.site.com/article.json"
                                    className="flex-1 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                                />
                                <button 
                                    onClick={handleUrlFetch}
                                    disabled={!urlInput || isProcessing}
                                    className="px-3 py-2 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-600 hover:text-indigo-800 dark:hover:text-white transition-all disabled:opacity-50"
                                >
                                    Fetch
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Category Selector (The new logic) */}
                    <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm flex items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <Tag size={18} />
                             </div>
                             <div>
                                 <h3 className="text-sm font-bold text-slate-900 dark:text-white">Target Category</h3>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">Where should this story appear?</p>
                             </div>
                         </div>
                         <div className="relative min-w-[200px]">
                             <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full appearance-none bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                             >
                                {settings.navCategories.length === 0 && <option value="General">General (Default)</option>}
                                {settings.navCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                             </select>
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                 <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                     <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                 </svg>
                             </div>
                         </div>
                    </div>

                    {/* Main Editor Area */}
                    <div className="relative group">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                            <span>JSON Editor</span>
                            <span className="text-xs text-slate-400">Editable Preview</span>
                        </label>
                        <textarea 
                            value={jsonInput}
                            onChange={(e) => {
                                setJsonInput(e.target.value);
                                tryAutoSelectCategory(e.target.value);
                            }}
                            className="w-full h-64 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl p-5 text-sm font-mono text-slate-800 dark:text-emerald-300 focus:outline-none focus:border-indigo-500 transition-all resize-y leading-relaxed shadow-sm"
                            placeholder='Paste content manually or use import tools above...'
                        />
                        {!jsonInput && (
                            <div className="absolute inset-0 top-8 flex items-center justify-center pointer-events-none opacity-30">
                                <div className="text-center text-slate-400">
                                    <FileJson size={48} className="mx-auto mb-2" />
                                    <p>Waiting for data...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === TAB: MANAGE === */}
            {activeTab === 'MANAGE' && (
                <div className="animate-fade-in space-y-4">
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                         <List size={18} /> Published Articles
                     </h3>
                     
                     {articleList.length === 0 ? (
                         <div className="text-center py-12 bg-white dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                             <FileText className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                             <p className="text-slate-500 dark:text-slate-400">No articles published yet.</p>
                         </div>
                     ) : (
                         <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left text-sm">
                                     <thead className="bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs font-bold">
                                         <tr>
                                             <th className="px-6 py-4">Article</th>
                                             <th className="px-6 py-4">Category</th>
                                             <th className="px-6 py-4 text-center">Views</th>
                                             <th className="px-6 py-4 text-right">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                         {articleList.map((article) => (
                                             <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                 <td className="px-6 py-4">
                                                     <div className="flex items-center gap-3">
                                                         <div className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                                             {article.media[0] && (
                                                                 <img src={article.media[0].src} className="w-full h-full object-cover" alt="" />
                                                             )}
                                                         </div>
                                                         <div className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-[200px] sm:max-w-xs">
                                                             {article.title}
                                                         </div>
                                                     </div>
                                                 </td>
                                                 <td className="px-6 py-4">
                                                     <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                         {article.category}
                                                     </span>
                                                 </td>
                                                 <td className="px-6 py-4 text-center font-mono text-slate-500 dark:text-slate-400">
                                                     {article.views?.toLocaleString() || 0}
                                                 </td>
                                                 <td className="px-6 py-4 text-right">
                                                     <button 
                                                         onClick={() => handleDeleteArticle(article.id)}
                                                         className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                         title="Delete Article"
                                                     >
                                                         <Trash2 size={18} />
                                                     </button>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                     )}
                </div>
            )}

            {/* === TAB: CONFIG === */}
            {activeTab === 'CONFIG' && (
                <div className="animate-fade-in space-y-8 max-w-2xl mx-auto py-4">
                    
                    {/* Identity Section */}
                    <div className="space-y-4">
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                             <PenTool size={18} /> Brand Identity
                         </h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                 <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Site Name</label>
                                 <input 
                                    type="text"
                                    value={settings.siteName}
                                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 font-serif text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                                 />
                             </div>

                             <div className="space-y-2">
                                 <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Contact Email</label>
                                 <div className="relative">
                                     <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                                     <input 
                                        type="email"
                                        value={settings.contactEmail}
                                        onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                                        className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                                     />
                                 </div>
                             </div>
                         </div>

                         {/* Logo Section (NEW) */}
                         <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Site Logo (Icon)</label>
                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl">
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 flex-shrink-0 bg-slate-100 dark:bg-black/40">
                                    <img src={settings.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input 
                                        type="text" 
                                        value={settings.logoUrl || ''}
                                        onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                                        placeholder="https://..." 
                                        className="w-full text-sm bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="file" 
                                            ref={logoInputRef}
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <button 
                                            onClick={() => logoInputRef.current?.click()}
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                        >
                                            <Upload size={12} /> Upload Image
                                        </button>
                                        <span className="text-xs text-slate-400">or paste URL above</span>
                                    </div>
                                </div>
                            </div>
                         </div>

                         <div className="space-y-2">
                             <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Footer Description (About)</label>
                             <div className="relative">
                                 <AlignLeft className="absolute left-3 top-3 text-slate-400" size={16} />
                                 <textarea 
                                    value={settings.footerDescription}
                                    onChange={(e) => setSettings({...settings, footerDescription: e.target.value})}
                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all min-h-[100px]"
                                 />
                             </div>
                         </div>
                        {/* Home Layout (compact selector) */}
                        <div className="space-y-3 pt-4">
                             <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Home Layout</label>
                             <p className="text-[11px] text-slate-400 dark:text-slate-500">Visual preview of how stories are arranged on the homepage (hero stays the same).</p>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                 <button
                                     type="button"
                                     onClick={() => setSettings({ ...settings, homeLayout: 'hero_masonry' })}
                                     className={`group relative rounded-xl border p-3 text-left transition-all flex flex-col gap-2 ${
                                         (settings.homeLayout || 'hero_masonry') === 'hero_masonry'
                                             ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                                             : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-black/40 hover:border-slate-300 dark:hover:border-slate-500'
                                     }`}
                                 >
                                     <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Masonry</span>
                                     <div className="space-y-1">
                                         <div className="h-2.5 rounded-md bg-slate-200 dark:bg-slate-700 w-5/6" />
                                         <div className="grid grid-cols-3 gap-1 mt-1">
                                             <div className="col-span-2 h-8 rounded-md bg-slate-200 dark:bg-slate-800" />
                                             <div className="col-span-1 h-8 rounded-md bg-slate-100 dark:bg-slate-900" />
                                             <div className="col-span-1 h-6 rounded-md bg-slate-100 dark:bg-slate-900" />
                                             <div className="col-span-2 h-6 rounded-md bg-slate-200 dark:bg-slate-800" />
                                         </div>
                                     </div>
                                 </button>
                                 <button
                                     type="button"
                                     onClick={() => setSettings({ ...settings, homeLayout: 'hero_grid' })}
                                     className={`group relative rounded-xl border p-3 text-left transition-all flex flex-col gap-2 ${
                                         settings.homeLayout === 'hero_grid'
                                             ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                                             : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-black/40 hover:border-slate-300 dark:hover:border-slate-500'
                                     }`}
                                 >
                                     <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Grid</span>
                                     <div className="space-y-1">
                                         <div className="h-2.5 rounded-md bg-slate-200 dark:bg-slate-700 w-5/6" />
                                         <div className="grid grid-cols-2 gap-1 mt-1">
                                             <div className="h-8 rounded-md bg-slate-200 dark:bg-slate-800" />
                                             <div className="h-8 rounded-md bg-slate-200 dark:bg-slate-800" />
                                             <div className="h-8 rounded-md bg-slate-200 dark:bg-slate-800" />
                                             <div className="h-8 rounded-md bg-slate-200 dark:bg-slate-800" />
                                         </div>
                                     </div>
                                 </button>
                                 <button
                                     type="button"
                                     onClick={() => setSettings({ ...settings, homeLayout: 'hero_list' })}
                                     className={`group relative rounded-xl border p-3 text-left transition-all flex flex-col gap-2 ${
                                         settings.homeLayout === 'hero_list'
                                             ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                                             : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-black/40 hover:border-slate-300 dark:hover:border-slate-500'
                                     }`}
                                 >
                                     <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Editorial</span>
                                     <div className="space-y-1">
                                         <div className="h-2.5 rounded-md bg-slate-200 dark:bg-slate-700 w-5/6" />
                                         <div className="space-y-1 mt-1">
                                             <div className="h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
                                             <div className="h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
                                             <div className="h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
                                         </div>
                                     </div>
                                 </button>
                             </div>
                        </div>
                    </div>

                    {/* Footer Links Manager */}
                    <div className="space-y-3 pt-6">
                         <button
                             type="button"
                             onClick={() => {
                                 const next = !isFooterLinksOpen;
                                 setIsFooterLinksOpen(next);
                                 if (next) {
                                     setIsNavMenuOpen(false);
                                 }
                             }}
                             className="w-full flex items-center justify-between gap-2 text-left px-1"
                         >
                             <span className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                                 <Globe size={18} /> Footer Links
                             </span>
                             <span className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                 {settings.footerLinks.length > 0
                                     ? `${settings.footerLinks.length} link${settings.footerLinks.length > 1 ? 's' : ''}`
                                     : 'Hidden if empty'}
                                 <span
                                     className={`transition-transform duration-200 inline-block ${
                                         isFooterLinksOpen ? 'rotate-180' : ''
                                     }`}
                                 >
                                     <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                         <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                     </svg>
                                 </span>
                             </span>
                         </button>
                         
                         {isFooterLinksOpen && (
                             <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                     <input 
                                        type="text"
                                        value={newLinkLabel}
                                        onChange={(e) => setNewLinkLabel(e.target.value)}
                                        placeholder="Label (e.g. LinkedIn)"
                                        className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                                     />
                                     <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={newLinkUrl}
                                            onChange={(e) => setNewLinkUrl(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                            placeholder="URL (https://...)"
                                            className="flex-1 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                                        />
                                        <button 
                                            onClick={handleAddLink}
                                            disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                                        >
                                            <Plus size={16} />
                                        </button>
                                     </div>
                                 </div>

                                 <div className="space-y-2">
                                     {settings.footerLinks.length === 0 ? (
                                         <p className="text-slate-400 italic text-sm text-center py-2">No custom footer links. This section will be hidden.</p>
                                     ) : (
                                        settings.footerLinks.map((link, idx) => (
                                            <div
                                                key={idx}
                                                draggable
                                                onDragStart={() => handleFooterLinkDragStart(idx)}
                                                onDragEnter={(e) => {
                                                    e.preventDefault();
                                                    handleFooterLinkDragEnter(idx);
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    handleFooterLinkDrop(idx);
                                                }}
                                                onDragEnd={() => {
                                                    setDraggedFooterLinkIndex(null);
                                                    setDragOverFooterLinkIndex(null);
                                                }}
                                                className={`group flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 transition-all cursor-move ${
                                                    dragOverFooterLinkIndex === idx
                                                        ? 'ring-2 ring-indigo-500/60 border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20'
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <GripVertical size={14} className="text-slate-400 dark:text-slate-500" />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{link.label}</span>
                                                        <span className="text-xs text-slate-400 truncate max-w-[200px]">{link.url}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleRemoveLink(idx)}
                                                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                     )}
                                 </div>
                             </div>
                         )}
                    </div>

                    {/* Category Manager */}
                    <div className="space-y-3 pt-6">
                         <button
                             type="button"
                             onClick={() => {
                                 const next = !isNavMenuOpen;
                                 setIsNavMenuOpen(next);
                                 if (next) {
                                     setIsFooterLinksOpen(false);
                                 }
                             }}
                             className="w-full flex items-center justify-between gap-2 text-left px-1"
                         >
                             <span className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                                 <Layout size={18} /> Navigation Menu
                             </span>
                             <span className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                 {settings.navCategories.length > 0
                                     ? `${settings.navCategories.length} categor${settings.navCategories.length === 1 ? 'y' : 'ies'}`
                                     : 'No categories yet'}
                                 <span
                                     className={`transition-transform duration-200 inline-block ${
                                         isNavMenuOpen ? 'rotate-180' : ''
                                     }`}
                                 >
                                     <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                         <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                     </svg>
                                 </span>
                             </span>
                         </button>
                         
                         {isNavMenuOpen && (
                             <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                                 <div className="flex gap-2 mb-6">
                                     <input 
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                        placeholder="New Category Name..."
                                        className="flex-1 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                                     />
                                     <button 
                                        onClick={handleAddCategory}
                                        disabled={!newCategory.trim()}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                                     >
                                         <Plus size={16} /> Add
                                     </button>
                                 </div>

                                 <div className="flex flex-wrap gap-2">
                                     {settings.navCategories.map((cat, index) => (
                                         <div
                                             key={cat}
                                             draggable
                                             onDragStart={() => handleCategoryDragStart(index)}
                                             onDragEnter={(e) => {
                                                 e.preventDefault();
                                                 handleCategoryDragEnter(index);
                                             }}
                                             onDragOver={(e) => e.preventDefault()}
                                             onDrop={(e) => {
                                                 e.preventDefault();
                                                 handleCategoryDrop(index);
                                             }}
                                             onDragEnd={() => {
                                                 setDraggedCategoryIndex(null);
                                                 setDragOverCategoryIndex(null);
                                             }}
                                             className={`group flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-move ${
                                                 dragOverCategoryIndex === index
                                                     ? 'ring-2 ring-indigo-500/60 border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20'
                                                     : ''
                                             }`}
                                         >
                                             <GripVertical size={14} className="text-slate-400 dark:text-slate-500" />
                                             <span>{cat}</span>
                                             <button 
                                                onClick={() => handleRenameCategory(cat)}
                                                className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                                             >
                                                 <PenTool size={14} />
                                             </button>
                                             <button 
                                                onClick={() => handleRemoveCategory(cat)}
                                                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                             >
                                                 <Trash2 size={14} />
                                             </button>
                                         </div>
                                     ))}
                                     {settings.navCategories.length === 0 && (
                                         <p className="text-slate-400 italic text-sm">No categories configured. The navigation bar will be empty.</p>
                                     )}
                                 </div>
                             </div>
                         )}
                    </div>

                </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 md:p-8 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm min-h-[40px]">
                    {status && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                            status.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 
                            status.type === 'error' ? 'bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400' :
                            'bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
                        }`}>
                            {status.type === 'success' && <CheckCircle2 size={14} />}
                            {status.type === 'error' && <AlertCircle size={14} />}
                            {status.type === 'info' && <span className="animate-pulse">●</span>}
                            {status.message}
                        </div>
                    )}
                </div>

                {activeTab === 'IMPORT' ? (
                     <button 
                        onClick={handleProcessAndPublish}
                        disabled={isProcessing || !jsonInput}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                            isProcessing || !jsonInput 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none' 
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:scale-[1.02] shadow-emerald-900/30'
                        }`}
                    >
                        {isProcessing ? 'Processing...' : <><Wand2 size={18} /> Auto-Enhance & Publish</>}
                    </button>
                ) : activeTab === 'CONFIG' ? (
                     <button 
                        onClick={handleSaveSettings}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] shadow-indigo-900/30"
                    >
                        <Save size={18} /> Save Configuration
                    </button>
                ) : (
                    <div /> /* Placeholder to keep alignment if needed in manage tab, though generally empty */
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminEditor;