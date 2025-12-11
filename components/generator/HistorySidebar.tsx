import React from 'react';
import { X, Clock, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { GeneratedArticle } from '../../services/generator';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: GeneratedArticle[];
  onLoadArticle: (article: GeneratedArticle) => void;
  onDeleteArticle: (id: string) => void;
  onClearHistory: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onLoadArticle,
  onDeleteArticle,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[65]"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-[66] flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white">Historial</h3>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-500">
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <FileText size={24} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No hay artículos en el historial
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Los artículos generados aparecerán aquí
              </p>
            </div>
          ) : (
            history.map(article => (
              <div
                key={article.id}
                className="group bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors cursor-pointer"
                onClick={() => onLoadArticle(article)}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  {article.media[0] ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                      {article.media[0].type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} className="text-slate-400" />
                        </div>
                      ) : (
                        <img
                          src={
                            article.media[0].data.startsWith('http') || article.media[0].data.startsWith('data:')
                              ? article.media[0].data
                              : `data:${article.media[0].mimeType};base64,${article.media[0].data}`
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="uppercase font-bold">{article.language}</span>
                      <span>•</span>
                      <span>{article.media.length} media</span>
                      <span>•</span>
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteArticle(article.id);
                    }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>

                {/* Keywords */}
                {article.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.keywords.slice(0, 3).map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClearHistory}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
              Limpiar historial
            </button>
          </div>
        )}
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};
