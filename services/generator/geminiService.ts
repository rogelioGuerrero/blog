import { 
  GeneratorSource, 
  UploadedFile, 
  GeneratorLanguage, 
  ArticleLength, 
  GeneratorAdvancedSettings, 
  RawSourceChunk,
  GeneratorConfig
} from "./types";

let geminiApiKey = "";

export const setGeminiApiKey = (key: string) => {
  geminiApiKey = key;
};

export const hasGeminiApiKey = () => !!geminiApiKey;

const generatorEndpoint = "/api/generator";

const callGenerator = async <T>(payload: Record<string, unknown>): Promise<T> => {
  const configStr = localStorage.getItem("blog_generator_config");
  let config: GeneratorConfig | undefined;
  try {
    if (configStr) config = JSON.parse(configStr);
  } catch (e) {
    console.error("Failed to parse generator config from localStorage", e);
  }

  const payloadNewsApiKey = typeof payload.newsApiKey === "string" ? payload.newsApiKey : undefined;
  const configNewsApiKey = config?.newsApiKey;
  const resolvedNewsApiKey = payloadNewsApiKey || configNewsApiKey || undefined;

  const response = await fetch(generatorEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...payload,
      apiKey: geminiApiKey || undefined,
      config,
      newsApiKey: resolvedNewsApiKey
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Error llamando al generador");
  }

  return response.json() as Promise<T>;
};


const getDomainFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

const categorizeDomain = (domain: string | null): string[] => {
  if (!domain) return [];
  const categories = new Set<string>();
  if (domain.endsWith('.gov') || domain.includes('.gob.') || domain.includes('.gov.')) {
    categories.add('oficial');
  }
  if (domain.includes('bank') || domain.includes('finance') || domain.includes('bloomberg') || domain.includes('ft.com') || domain.includes('wsj.com')) {
    categories.add('finanzas');
  }
  if (domain.includes('edu') || domain.includes('.org')) {
    categories.add('institucional');
  }
  categories.add('medios');
  return Array.from(categories);
};

export const generateNewsContent = async (
  input: string,
  mode: "topic" | "document",
  file: UploadedFile | null,
  language: GeneratorLanguage,
  length: ArticleLength,
  settings: GeneratorAdvancedSettings,
  newsApiKey?: string
): Promise<{
  title: string;
  content: string;
  sources: GeneratorSource[];
  rawSourceChunks: RawSourceChunk[];
  imagePrompt: string;
  keywords: string[];
  metaDescription: string;
}> => {
  const { textData } = await callGenerator<{
    textData: {
      title: string;
      content: string;
      sources: GeneratorSource[];
      rawSourceChunks: RawSourceChunk[];
      imagePrompt: string;
      keywords: string[];
      metaDescription: string;
    };
  }>({
    action: "text",
    input,
    mode,
    file,
    language,
    length,
    settings,
    newsApiKey: newsApiKey || undefined
  });

  return {
    ...textData,
    content: normalizeToMarkdown(textData.content)
  };
};

export const generateNewsImages = async (prompt: string): Promise<string[]> => {
  const { images } = await callGenerator<{ images: string[] }>({
    action: "images",
    prompt
  });
  return images;
};

export const generateNewsAudio = async (text: string, language: GeneratorLanguage, settings: GeneratorAdvancedSettings): Promise<string> => {
  const { audioUrl } = await callGenerator<{ audioUrl: string }>({
    action: "audio",
    text,
    language,
    settings
  });
  return audioUrl;
};

const normalizeToMarkdown = (input: string): string => {
  if (!input) return "";

  let text = input.replace(/\r\n/g, "\n");

  text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, inner) => {
    const hashes = "#".repeat(Number(level));
    return `${hashes} ${String(inner).trim()}`;
  });

  text = text.replace(/<br\s*\/?>(\s*)/gi, "\n");
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<\/p>/gi, "\n\n");

  text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, (_m, _tagOpen, inner) => {
    return `**${String(inner).trim()}**`;
  });

  text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, (_m, _tagOpen, inner) => {
    return `*${String(inner).trim()}*`;
  });

  text = text.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
    const label = String(inner).trim() || href;
    return `[${label}](${href})`;
  });

  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
    const raw = String(inner).replace(/\r\n/g, "\n");
    return raw
      .split(/\n/)
      .map((line: string) => (line.trim() ? `> ${line.trim()}` : ""))
      .join("\n");
  });

  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner) => {
    const content = String(inner).trim();
    return content ? `- ${content}\n` : "";
  });
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, "");
  text = text.replace(/<\/?[^>]+>/g, "");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
};
