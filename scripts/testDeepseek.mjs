const args = process.argv.slice(2);
let topicParts = [];
let model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
let temperature = 0.6;

for (const arg of args) {
  if (arg.startsWith("--model=")) {
    model = arg.split("=")[1] || model;
    continue;
  }
  if (arg.startsWith("--temp=")) {
    const value = Number(arg.split("=")[1]);
    if (!Number.isNaN(value)) {
      temperature = value;
    }
    continue;
  }
  topicParts.push(arg);
}

const topic = topicParts.join(" ") || "Explique el estado actual de la energía solar";
const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.error("⚠️  Set DEEPSEEK_API_KEY before running this script.");
  process.exit(1);
}

console.log(`\n▶️  Testing DeepSeek model: ${model}`);
console.log(`   Prompt: ${topic}`);
console.log(`   Temperature: ${temperature}`);

const prompt = `You are an AI news generator. Always respond using the following separators and provide verifiable sources.\n\n` +
  `|||HEADLINE|||\n` +
  `Short, engaging title\n` +
  `|||BODY|||\n` +
  `Two concise paragraphs in Markdown with up-to-date facts\n` +
  `|||SOURCES|||\n` +
  `Strict JSON array like [{"title":"","url":""}] covering every reference actually cited.`;

const requestBody = {
  model,
  temperature,
  messages: [
    { role: "system", content: "You are a rigorous investigative journalist." },
    { role: "user", content: `${prompt}\n\nTOPIC: ${topic}` }
  ]
};

try {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  console.log("\n📝 Raw response:\n");
  console.log(text.trim());

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

  console.log("\n✅ DeepSeek request finished without transport errors.\n");
} catch (error) {
  console.error("\n❌ DeepSeek request failed:");
  console.error(error.message || error);
  process.exit(1);
}
