import { GoogleGenAI } from "@google/genai";

import { AI_MODELS, AIModelRole } from "../services/generator/types.js";

const args = process.argv.slice(2);
let topicParts = [];
let model = process.env.GEMINI_MODEL || AI_MODELS.gemini[AIModelRole.TEXT];
let useSearchTool = false;

for (const arg of args) {
  if (arg.startsWith("--model=")) {
    model = arg.split("=")[1] || model;
    continue;
  }
  if (arg === "--search") {
    useSearchTool = true;
    continue;
  }
  topicParts.push(arg);
}

const topic = topicParts.join(" ") || "Explain what Gemini grounding metadata is";
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("⚠️  Set GEMINI_API_KEY before running this script.");
  process.exit(1);
}

console.log(`\n▶️  Testing Gemini model: ${model}`);
console.log(`   Prompt: ${topic}`);
console.log(`   googleSearch tool: ${useSearchTool ? "enabled" : "disabled"}`);

const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta1" });

const prompt = `You are a news explainer bot.\n` +
  `Respond using the separators below and cite every external reference.\n\n` +
  `|||HEADLINE|||\n` +
  `A short descriptive title\n` +
  `|||BODY|||\n` +
  `Two concise paragraphs in Markdown\n` +
  `|||SOURCES|||\n` +
  `Strict JSON array like [{"title":"","url":""}] with every cited source.`;

const contents = [{ text: `${prompt}\n\nTOPIC: ${topic}` }];

const config = useSearchTool ? { tools: [{ googleSearch: {} }] } : undefined;

try {
  const response = await ai.models.generateContent({
    model,
    contents,
    config
  });

  const text = response.text || "";
  console.log("\n📝 Raw response:\n");
  console.log(text.trim());

  const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  if (grounding.length > 0) {
    console.log("\n🔗 Grounding chunks:");
    grounding.forEach((chunk, idx) => {
      const source = chunk.web ?? chunk;
      console.log(`  [${idx + 1}] ${source?.title || "(sin título)"}`);
      console.log(`      ${source?.uri || "(sin URL)"}`);
      if (source?.snippet) {
        console.log(`      snippet: ${source.snippet}`);
      }
    });
  } else {
    console.log("\nℹ️  No grounding metadata returned.");
  }

  const sourcesSection = text.split("|||SOURCES|||")[1] || "";
  let declaredSources = [];
  if (sourcesSection.trim()) {
    try {
      const jsonCandidate = sourcesSection.replace(/```json|```/g, "");
      declaredSources = JSON.parse(jsonCandidate.trim());
    } catch (error) {
      console.warn("❗ Could not parse declared sources JSON:", error.message);
    }
  }

  if (declaredSources.length > 0) {
    console.log("\n📚 Declared sources:");
    declaredSources.forEach((src, idx) => {
      console.log(`  [${idx + 1}] ${src.title || "(sin título)"}`);
      console.log(`      ${src.url || src.uri || "(sin URL)"}`);
    });
  } else {
    console.log("\nℹ️  The model did not include declared sources in the |||SOURCES||| block.");
  }

  console.log("\n✅ Gemini request finished without transport errors.\n");
} catch (error) {
  console.error("\n❌ Gemini request failed:");
  console.error(error?.response?.error || error);
  process.exit(1);
}
