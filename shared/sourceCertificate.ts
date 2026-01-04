import type { ArticleSourcesPayload, SourceCertificate } from '../types';

const ensureArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }
  return [];
};

const coerceToPayload = (raw: any): ArticleSourcesPayload => {
  if (!raw) {
    return { list: [], certificate: null };
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return coerceToPayload(parsed);
    } catch {
      return { list: [], certificate: null };
    }
  }

  if (Array.isArray(raw)) {
    return { list: ensureArray(raw), certificate: null };
  }

  if (typeof raw === 'object') {
    const list = ensureArray((raw as ArticleSourcesPayload).list ?? (raw as any).sources ?? []);
    const certificate = (raw as ArticleSourcesPayload).certificate ?? null;
    return {
      list,
      certificate,
    };
  }

  return { list: [], certificate: null };
};

export const ensureSourcePayload = (raw: any): ArticleSourcesPayload => coerceToPayload(raw);

export const extractSourcesInfo = (raw: any): { list: string[]; certificate: SourceCertificate | null } => {
  const payload = ensureSourcePayload(raw);
  return {
    list: payload.list,
    certificate: payload.certificate ?? null,
  };
};

export const buildSourcePayload = (
  list: string[] = [],
  certificate?: SourceCertificate | null
): ArticleSourcesPayload => {
  const uniqueList = Array.from(new Set(ensureArray(list)));
  return {
    list: uniqueList,
    certificate: certificate ?? null,
  };
};
