import { 
  GeneratorLanguage, 
  ArticleLength, 
  GeneratorAdvancedSettings,
  GeneratedArticle
} from "./types";

let deepseekApiKey = "";

export const setDeepseekApiKey = (key: string) => {
  deepseekApiKey = key;
};

export const hasDeepseekApiKey = () => !!deepseekApiKey;

const fetchDeepseek = async (messages: any[]) => {
  if (!deepseekApiKey) throw new Error("DeepSeek API Key no configurada");

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${deepseekApiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      response_format: { type: "text" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error de DeepSeek: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const generateArticleWithDeepseek = async (
  input: string,
  language: GeneratorLanguage,
  length: ArticleLength,
  settings: GeneratorAdvancedSettings,
  mode: "topic" | "document" = "topic"
): Promise<{
  title: string;
  content: string;
  imagePrompt: string;
  keywords: string[];
  metaDescription: string;
}> => {
  const langNames = { es: "Spanish", en: "English", fr: "French", pt: "Portuguese", de: "German" };
  const targetLang = langNames[language];
  const lengthGuide = { short: "approx 300 words", medium: "approx 600 words", long: "approx 1000 words" };

  const systemPrompt = `You are a world-class journalist engine. 
  Target Language: ${targetLang}.
  Target Length: ${lengthGuide[length]}.
  
  STYLE CONFIGURATION:
  - Tone: ${settings.tone.toUpperCase()}
  - Target Audience: ${settings.audience.toUpperCase()}
  - Editorial Focus (Angle): ${settings.focus.toUpperCase()}
  
  Task: Write a news article following these constraints. Use your internal knowledge to provide accurate and verifiable information.
  
  Structure the response with these EXACT separators:
  |||HEADLINE|||
  (Write the catchy headline here)
  |||BODY|||
  (Write the article body in Markdown here. Use H3 for subheaders.)
  |||IMAGE_PROMPT|||
  (Write a highly detailed English prompt for an image generator.)
  |||METADATA|||
  (Provide a valid JSON object with "keywords" (array of strings) and "metaDescription" (string))`;

  const userPrompt = mode === "document" 
    ? `Analyze the provided context and create a news story. Topic/Instruction: ${input || "General summary"}`
    : `Topic: "${input}". Focus on recent events and reliable information.`;

  const fullText = await fetchDeepseek([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  const parts = fullText.split(/\|\|\|[A-Z_]+\|\|\|/);
  const title = parts[1]?.trim() || "Articulo Generado";
  const content = parts[2]?.trim() || fullText;
  const imagePrompt = parts[3]?.trim() || `Editorial illustration for ${input}`;
  const metadataRaw = parts[4]?.trim() || "{}";

  let keywords = [];
  let metaDescription = "";
  try {
    const meta = JSON.parse(metadataRaw.replace(/```json|```/g, ""));
    keywords = meta.keywords || [];
    metaDescription = meta.metaDescription || "";
  } catch (e) {
    console.warn("Error al parsear metadata", e);
  }

  return { title, content, imagePrompt, keywords, metaDescription };
};

export const generateSocialPostWithDeepseek = async (
  article: GeneratedArticle,
  platform: 'x' | 'linkedin' | 'facebook'
): Promise<string> => {
  const systemPrompt = `You are a social media expert. Create an engaging post for ${platform.toUpperCase()} based on the provided article.
  Use appropriate emojis and hashtags. Keep it professional yet engaging.`;
  
  const userPrompt = `Article Title: ${article.title}\nSummary: ${article.metaDescription}\nContent Snippet: ${article.content.substring(0, 500)}`;

  return await fetchDeepseek([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);
};
