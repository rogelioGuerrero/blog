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

export const extractSourcesInfo = (raw: any): { list: string[] } => {
  return {
    list: coerceToList(raw),
  };
};

export const buildSourcePayload = (list: string[] = []): string[] => {
  return Array.from(new Set(ensureArray(list)));
};
