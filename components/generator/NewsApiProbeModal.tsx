import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Loader2, ExternalLink } from 'lucide-react';
import { searchNewsApiRaw, NewsApiLanguage, NewsApiRegion, NewsApiTimeFrame, NewsApiSearchResponse } from '../../services/newsapi';

interface NewsApiProbeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultNewsApiKey?: string;
}

export const NewsApiProbeModal: React.FC<NewsApiProbeModalProps> = ({
  isOpen,
  onClose,
  defaultNewsApiKey,
}) => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<NewsApiLanguage>('es');
  const [timeFrame, setTimeFrame] = useState<NewsApiTimeFrame>('any');
  const [sourceRegion, setSourceRegion] = useState<NewsApiRegion>('world');
  const [pageSize, setPageSize] = useState(5);
  const [newsApiKey, setNewsApiKey] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NewsApiSearchResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setData(null);
    setIsLoading(false);
    setNewsApiKey(defaultNewsApiKey || '');
  }, [isOpen, defaultNewsApiKey]);

  const canSearch = query.trim().length > 0;

  const effectivePageSize = useMemo(() => {
    if (!Number.isFinite(pageSize)) return 5;
    return Math.max(1, Math.min(20, Math.floor(pageSize)));
  }, [pageSize]);

  const runSearch = async () => {
    if (!canSearch) return;
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await searchNewsApiRaw({
        query: query.trim(),
        language,
        timeFrame,
        sourceRegion,
        pageSize: effectivePageSize,
        newsApiKey: newsApiKey.trim() || undefined,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Error consultando NewsAPI');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">NewsAPI Probe</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consulta NewsAPI en crudo (sin IA)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Query</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: cotización del euro hoy"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Page Size</label>
              <input
                type="number"
                min={1}
                max={20}
                value={effectivePageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as NewsApiLanguage)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="fr">Francés</option>
                <option value="pt">Portugués</option>
                <option value="de">Alemán</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Temporalidad</label>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as NewsApiTimeFrame)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="any">Cualquiera</option>
                <option value="24h">24h</option>
                <option value="48h">48h</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Región</label>
              <select
                value={sourceRegion}
                onChange={(e) => setSourceRegion(e.target.value as NewsApiRegion)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="world">Global</option>
                <option value="us">USA</option>
                <option value="eu">Europa</option>
                <option value="latam">LatAm</option>
                <option value="asia">Asia</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">NewsAPI Key (opcional si ya está en Settings)</label>
              <input
                type="password"
                value={newsApiKey}
                onChange={(e) => setNewsApiKey(e.target.value)}
                placeholder="..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <button
            onClick={runSearch}
            disabled={!canSearch || isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <Search size={18} />
                Buscar en NewsAPI
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="text-sm text-slate-700 dark:text-slate-200 font-semibold">Resultado</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  endpointUsed: <span className="font-mono">{String(data.endpointUsed)}</span> | totalResults: <span className="font-mono">{String(data.totalResults)}</span>
                </div>
                {data.warning && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 mt-2">{data.warning}</div>
                )}
              </div>

              <div className="space-y-3">
                {data.articles.length === 0 ? (
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300">
                    No hay artículos para este query.
                  </div>
                ) : (
                  data.articles.map((a, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {a.source?.name || 'Unknown'} • {a.publishedAt}
                          </div>
                        </div>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          Abrir
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      {(a.description || a.content) && (
                        <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {(a.description || '').trim()}
                          {(a.description && a.content) ? '\n\n' : ''}
                          {(a.content || '').trim()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <details className="p-4 text-xs text-slate-600 dark:text-slate-300">
                  <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Debug JSON</summary>
                  <pre className="mt-3 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 max-h-72 overflow-y-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
