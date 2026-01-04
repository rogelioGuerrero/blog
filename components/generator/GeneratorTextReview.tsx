import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Edit3, Check, ExternalLink, Loader2 } from 'lucide-react';
import { GeneratedArticle, GeneratorSource } from '../../services/generator';

interface GeneratorTextReviewProps {
  article: GeneratedArticle;
  onBack: () => void;
  onConfirm: (article: GeneratedArticle) => void;
  isLoading: boolean;
}

export const GeneratorTextReview: React.FC<GeneratorTextReviewProps> = ({
  article,
  onBack,
  onConfirm,
  isLoading
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedContent, setEditedContent] = useState(article.content);

  const handleConfirm = () => {
    const updatedArticle: GeneratedArticle = {
      ...article,
      title: editedTitle,
      content: editedContent
    };
    onConfirm(updatedArticle);
  };

  // Group sources by domain
  const groupedSources = article.sources.reduce<Record<string, GeneratorSource[]>>((acc, src) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isEditing
              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {isEditing ? <Check size={16} /> : <Edit3 size={16} />}
          {isEditing ? 'Listo' : 'Editar'}
        </button>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Título</label>
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        ) : (
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
            {editedTitle}
          </h2>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Contenido</label>
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-80 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto">
            <div className="whitespace-pre-wrap text-sm">{editedContent}</div>
          </div>
        )}
      </div>

      {/* Sources */}
      {article.sources.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
            Fuentes ({article.sources.length})
          </label>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {Object.entries(groupedSources).map(([domain, sources]) => (
                <a
                  key={domain}
                  href={sources[0].uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {domain}
                  {sources.length > 1 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded-full text-[10px]">
                      {sources.length}
                    </span>
                  )}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keywords */}
      {article.keywords.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Keywords</label>
          <div className="flex flex-wrap gap-2">
            {article.keywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleConfirm}
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 disabled:shadow-none transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Generando imágenes...
          </>
        ) : (
          <>
            Continuar a Medios
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  );
};
