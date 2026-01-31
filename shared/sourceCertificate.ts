import type { SourceCertificate } from '../types';

const ensureArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }
  return [];
};

const coerceToList = (raw: any): string[] => {
  if (!raw) {
    return [];
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return coerceToList(parsed);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return ensureArray(raw);
  }

  if (typeof raw === 'object') {
    return ensureArray((raw as any).list ?? (raw as any).sources ?? []);
  }

  return [];
};

export const extractSourcesInfo = (raw: any): { list: string[]; certificate?: SourceCertificate } => {
  if (!raw) return { list: [] };

  let list: string[] = [];
  let certificate: SourceCertificate | undefined;

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return extractSourcesInfo(parsed);
    } catch {
      return { list: [] };
    }
  }

  if (Array.isArray(raw)) {
    list = ensureArray(raw);
  } else if (typeof raw === 'object') {
    list = ensureArray(raw.list ?? raw.sources ?? []);
    certificate = raw.certificate;
  }

  return { list, certificate };
};

export const buildSourcePayload = (list: string[] = [], certificate?: SourceCertificate): any => {
  const sources = Array.from(new Set(ensureArray(list)));
  if (certificate) {
    return {
      list: sources,
      certificate
    };
  }
  return sources;
};
