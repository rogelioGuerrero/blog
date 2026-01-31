import { Buffer } from "node:buffer";
import { GoogleGenAI, Modality } from "@google/genai";
import type { Config } from "@netlify/functions";
import {
  AIModelRole,
  AI_MODELS,
  ArticleLength,
  GeneratorAdvancedSettings,
  GeneratorConfig,
  GeneratorInputMode,
  GeneratorLanguage,
  GeneratorSource,
  RawSourceChunk,
  UploadedFile
} from "../../services/generator/types";

interface TextRequestPayload {
  action: "text";
  input: string;
  mode: GeneratorInputMode;
  file: UploadedFile | null;
  language: GeneratorLanguage;
  length: ArticleLength;
  settings: GeneratorAdvancedSettings;
}

interface ImagesRequestPayload {
  action: "images";
  prompt: string;
}

interface AudioRequestPayload {
  action: "audio";
  text: string;
  language: GeneratorLanguage;
  settings: GeneratorAdvancedSettings;
}

type GeneratorRequestPayload = (TextRequestPayload | ImagesRequestPayload | AudioRequestPayload) & {
  apiKey?: string;
};

const IMAGE_MODEL_CANDIDATES = [
  "imagen-3.0-generate-001",
  "imagen-3.0-fast-generate-001",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview"
];

const GEMINI_SEARCH_ENABLED = process.env.GEMINI_SEARCH_ENABLED === "true";

interface NewsAPIArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  source: { name: string };
  publishedAt: string;
}

const searchNewsAPI = async (query: string, timeFrame: string, apiKey: string): Promise<NewsAPIArticle[]> => {
  if (!apiKey) return [];
  
  const now = new Date();
  const timeMap: Record<string, number> = {
    '24h': 1,
    '48h': 2,
    '7d': 7,
    'week': 7,
    '30d': 30,
    'month': 30
  };
  
  const daysAgo = timeMap[timeFrame] || 7;
  const fromDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const fromISO = fromDate.toISOString();
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromISO.split('T')[0]}&sortBy=publishedAt&language=es&pageSize=5&apiKey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('NewsAPI responded with error:', response.status, errorText);
      return [];
    }
    const data = await response.json();
    console.log(`NewsAPI found ${data.articles?.length || 0} articles for query: ${query}`);
    return data.articles || [];
  } catch (error) {
    console.error('NewsAPI search failed:', error);
    return [];
  }
};

const isToolNotFoundError = (error: any): boolean => {
  const statusCandidates = [
    error?.status,
    error?.code,
    error?.error?.status,
    error?.error?.code
  ];

  const normalizedStatus = statusCandidates
    .filter((value) => value !== undefined && value !== null)
    .map((value) => (typeof value === "string" ? value.toUpperCase() : value));

  if (normalizedStatus.some((value) => value === 404 || value === "404")) {
    return true;
  }

  if (normalizedStatus.some((value) => typeof value === "string" && value.includes("NOT FOUND"))) {
    return true;
  }

  const message = (error?.message || error?.error?.message || "").toLowerCase();
  return message.includes("googlesearch") || message.includes("vertex");
};

const langNames: Record<GeneratorLanguage, string> = {
  es: "Spanish",
  en: "English",
  fr: "French",
  pt: "Portuguese",
  de: "German"
};

const lengthGuide: Record<ArticleLength, string> = {
  short: "approx 300 words",
  medium: "approx 600 words",
  long: "approx 1000 words"
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as GeneratorRequestPayload;
    const apiKey = body.apiKey || process.env.GEMINI_API_KEY;
    const config = (body as any).config as GeneratorConfig | undefined;

    if (!apiKey) {
      return jsonResponse({ error: "Gemini API key is required" }, 400);
    }

    const ai = new GoogleGenAI({ apiKey }) as any;

    switch (body.action) {
      case "text":
        return jsonResponse({ textData: await handleTextGeneration(ai, body, config) });
      case "images":
        return jsonResponse({ images: await handleImageGeneration(ai, body) });
      case "audio":
        return jsonResponse({ audioUrl: await handleAudioGeneration(ai, body, config) });
      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (error: any) {
    console.error("Generator function failed", error);
    return jsonResponse({ error: error?.message || "Generator failed" }, 500);
  }
};

export const config: Config = {
  path: "/api/generator"
};

const handleTextGeneration = async (ai: GoogleGenAI, payload: TextRequestPayload, config?: GeneratorConfig) => {
  const { input, mode, file, language, length, settings } = payload;

  const targetLang = langNames[language];
  
  let newsContext = '';
  let realSources: NewsAPIArticle[] = [];
  
  if (mode === "topic" && config?.newsApiKey && settings.timeFrame !== "any") {
    realSources = await searchNewsAPI(input, settings.timeFrame, config.newsApiKey);
    
    if (realSources.length > 0) {
      newsContext = '\n\nREAL NEWS SOURCES (use these as primary references):\n';
      realSources.forEach((article, idx) => {
        newsContext += `\n${idx + 1}. [${article.source.name}] ${article.title}\n`;
        newsContext += `   URL: ${article.url}\n`;
        newsContext += `   Published: ${article.publishedAt}\n`;
        if (article.description) {
          newsContext += `   Summary: ${article.description}\n`;
        }
      });
      newsContext += '\n\nIMPORTANT: Base your article on these real sources. Include relevant URLs in your content.';
    }
  }
  
  const systemPrompt = `You are a world-class journalist engine. 
    Target Language: ${targetLang}.
    Target Length: ${lengthGuide[length]}.
    
    STYLE CONFIGURATION:
    - Tone: ${settings.tone.toUpperCase()}
    - Target Audience: ${settings.audience.toUpperCase()}
    - Editorial Focus (Angle): ${settings.focus.toUpperCase()}
    
    SOURCE QUALITY BASELINE (ALWAYS ENFORCED):
    - When using external information or news coverage, always rely on reputable, well-known news outlets and official institutions.
    - Avoid blogs, forums, tabloids, and low-credibility websites as primary sources.
    ${realSources.length > 0 ? '- PRIORITIZE the real news sources provided below in your article.' : ''}
    
    CONTENT REQUIREMENTS (STRICT):
    ${settings.includeQuotes ? "- MUST include direct quotes (with attribution) from relevant figures or documents." : ""}
    ${settings.includeStats ? "- MUST include specific data, statistics, percentages, or financial figures." : ""}
    ${settings.includeCounterArguments ? "- MUST include a counter-argument, alternative perspective, or risks involved to ensure balance." : ""}
    
    Task: Write a news article following these constraints.${realSources.length > 0 ? ' Use the provided real news sources as your primary information.' : ' Use your internal knowledge to provide accurate and verifiable information.'}
    ${newsContext}
    
    Structure the response with these EXACT separators:
    |||HEADLINE|||
    (Write the catchy headline here)
    |||BODY|||
    (Write the article body in Markdown here. Use H3 for subheaders.)
    |||IMAGE_PROMPT|||
    (Write a highly detailed English prompt for an image generator.)
    |||METADATA|||
    (Provide a valid JSON object with "keywords" (array of strings) and "metaDescription" (string))`;

  let contents: any[] = [];

  if (mode === "document" && file) {
    contents = [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: file.mimeType, data: file.data } },
          { text: `${systemPrompt}\n\nSource Material Provided. Instruction: ${input || "Create a story based on this document."}` }
        ]
      }
    ];
  } else {
    let userPrompt = `Topic: "${input}".`;

    if (settings.timeFrame !== "any") {
      userPrompt += ` Focus on events from the last ${settings.timeFrame} if possible.`;
    }

    contents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
      }
    ];
  }

  const modelFromUI = config?.modelOverrides?.gemini?.[AIModelRole.TEXT];
  const model = modelFromUI || AI_MODELS.gemini[AIModelRole.TEXT];

  const result = await ai.models.generateContent({
    model,
    contents,
    ...(GEMINI_SEARCH_ENABLED ? { tools: [{ googleSearch: {} }] } : {})
  });

  const fullText = result.text || "";
  const parts = fullText.split(/\|\|\|[A-Z_]+\|\|\|/);

  const title = parts[1]?.trim() || "Noticia Generada";
  const rawContent = parts[2]?.trim() || fullText;
  const content = normalizeToMarkdown(rawContent);
  const imagePrompt = parts[3]?.trim() || `Editorial illustration representing ${input}`;
  const metadataRaw = parts[4]?.trim() || "{}";
  const sourcesRaw = parts[5]?.trim() || "[]";

  let keywords: string[] = [];
  let metaDescription = "";

  try {
    const jsonStr = metadataRaw.replace(/```json|```/g, "");
    const metadata = JSON.parse(jsonStr);
    keywords = metadata.keywords || [];
    metaDescription = metadata.metaDescription || "";
  } catch (e) {
    console.warn("Failed to parse metadata JSON", e);
  }

  let declaredSources: Array<{ title?: string; url?: string; uri?: string }> = [];
  try {
    const jsonStr = sourcesRaw.replace(/```json|```/g, "");
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      declaredSources = parsed;
    }
  } catch (e) {
    console.warn("Failed to parse sources JSON", e);
  }

  const declaredChunks: RawSourceChunk[] = declaredSources
    .map((entry) => {
      if (!entry) return null;
      const title = typeof entry.title === "string" ? entry.title.trim() : "";
      const uri = typeof entry.url === "string" ? entry.url.trim() : typeof entry.uri === "string" ? entry.uri.trim() : "";
      if (!title || !uri) return null;
      return {
        title,
        uri,
        snippet: null,
        provider: "model_declared"
      } as RawSourceChunk;
    })
    .filter((chunk): chunk is RawSourceChunk => !!chunk?.uri && !!chunk?.title);

  const chunks = (result as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  let rawSourceChunks: RawSourceChunk[] = chunks.map((chunk: any) => {
    const source = chunk.web ?? chunk;
    return {
      title: source?.title ?? chunk.title ?? null,
      uri: source?.uri ?? chunk.uri ?? null,
      snippet: source?.snippet ?? chunk.snippet ?? null,
      provider: source?.provider ?? chunk.provider ?? null
    };
  });

  if (rawSourceChunks.length === 0 && declaredChunks.length > 0) {
    rawSourceChunks = declaredChunks;
  }
  
  if (realSources.length > 0) {
    const newsAPIChunks: RawSourceChunk[] = realSources.map(article => ({
      title: `[${article.source.name}] ${article.title}`,
      uri: article.url,
      snippet: article.description || null,
      provider: "newsapi"
    }));
    rawSourceChunks = [...newsAPIChunks, ...rawSourceChunks];
  }

  const rawSources = rawSourceChunks
    .map((chunk) => {
      if (chunk.uri && chunk.title) {
        return { title: chunk.title, uri: chunk.uri };
      }
      return null;
    })
    .filter((s): s is { title: string; uri: string } => s !== null);

  const uniqueSources: GeneratorSource[] = [];
  const seenUris = new Set<string>();
  const seenTitles = new Set<string>();

  for (const source of rawSources) {
    const uri = source.uri;
    const isVertexRedirect = uri.includes("vertexaisearch");
    const isGoogleSearch = uri.includes("google.com/search") || uri.includes("google.com/url");

    if (isGoogleSearch) {
      continue;
    }

    let titleLabel = source.title.trim();

    if (isVertexRedirect) {
      const candidate = titleLabel;
      if (!(candidate.includes('.') && !candidate.includes(' '))) {
        titleLabel = 'Referencia verificada';
      }
    } else if (titleLabel.includes("http") || titleLabel.includes("www.") || titleLabel.length > 100) {
      try {
        const hostname = new URL(uri).hostname;
        titleLabel = hostname.replace("www.", "");
      } catch (e) {
        // ignore
      }
    }

    if (!seenUris.has(uri) && !seenTitles.has(titleLabel)) {
      seenUris.add(uri);
      seenTitles.add(titleLabel);
      const domain = getDomainFromUrl(uri) || (titleLabel.includes('.') && !titleLabel.includes(' ') ? titleLabel : null);
      uniqueSources.push({
        title: titleLabel,
        uri,
        domain: domain || undefined,
        categories: categorizeDomain(domain),
      });
    }
  }

  if (mode === "document" && file) {
    uniqueSources.push({ title: file.name, uri: "#" });
  }

  return {
    title,
    content,
    imagePrompt,
    sources: uniqueSources,
    rawSourceChunks,
    keywords,
    metaDescription
  };
};

const handleImageGeneration = async (ai: GoogleGenAI, payload: ImagesRequestPayload) => {
  console.log("Image generation with Gemini is not supported. Use Pexels instead.");
  return [];
};

const handleAudioGeneration = async (ai: GoogleGenAI, payload: AudioRequestPayload, config?: GeneratorConfig) => {
  const { text, settings } = payload;
  let selectedVoice = "Aoede";

  const voiceByTone: Record<string, string> = {
    objective: "Fenrir",
    corporate: "Fenrir",
    editorial: "Aoede",
    narrative: "Aoede",
    explanatory: "Zephyr",
    sensational: "Puck",
    satirical: "Puck"
  };

  if (settings && settings.tone) {
    selectedVoice = voiceByTone[settings.tone] || "Aoede";
  }

  const safeText = text.length > 40000 ? text.substring(0, 40000) + "..." : text;

  const modelFromUI = config?.modelOverrides?.gemini?.[AIModelRole.AUDIO];
  const model = modelFromUI || AI_MODELS.gemini[AIModelRole.AUDIO];

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: safeText }]
      }
    ],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: selectedVoice }
        }
      }
    }
  });

  const base64Audio = (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  return buildWavDataUrl(base64Audio, 24000);
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

const buildWavDataUrl = (rawBase64: string, sampleRate: number = 24000): string => {
  const pcmBuffer = Buffer.from(rawBase64, "base64");
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([header, pcmBuffer]);
  const base64Wav = wavBuffer.toString("base64");
  return `data:audio/wav;base64,${base64Wav}`;
};

const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
};
