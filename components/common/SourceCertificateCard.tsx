import React from 'react';
import { ShieldCheck, ExternalLink, Tags } from 'lucide-react';
import type { SourceCertificate } from '../../types';

interface SourceCertificateCardProps {
  certificate?: SourceCertificate | null;
  variant?: 'panel' | 'article';
}

const getVariantClasses = (variant: 'panel' | 'article' = 'panel') => {
  switch (variant) {
    case 'article':
      return {
        container: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
        chip: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      };
    default:
      return {
        container: 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700',
        chip: 'bg-white/80 dark:bg-slate-700 text-slate-600 dark:text-slate-200',
      };
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
};

export const SourceCertificateCard: React.FC<SourceCertificateCardProps> = ({ certificate, variant = 'panel' }) => {
  if (!certificate || !certificate.sources?.length) return null;

  const classes = getVariantClasses(variant);

  return (
    <div className={`${classes.container} rounded-2xl p-5 space-y-4`}
      aria-label="Certificado de procedencia"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Certificado de procedencia</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Emitido {formatDate(certificate.generatedAt)}</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
          {certificate.totalMentions} menciones verificadas
        </span>
      </div>

      <div className="space-y-3">
        {certificate.sources.map((source) => (
          <div
            key={source.id}
            className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{source.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{source.domain}</p>
              </div>
              {source.url && source.url !== '#' && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  Ver fuente
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <Tags size={10} />
                {source.mentions} menciones
              </span>
              {source.categories?.filter(Boolean).map((category) => (
                <span
                  key={`${source.id}-${category}`}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${classes.chip}`}
                >
                  {category}
                </span>
              ))}
            </div>

            {source.snippet && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
                “{source.snippet}”
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
