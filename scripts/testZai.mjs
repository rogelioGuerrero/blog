const args = process.argv.slice(2);
let topicParts = [];
let model = process.env.ZAI_MODEL || "glm-4.5";
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

const topic = topicParts.join(" ") || "Explain what Z.ai is";
const apiKey = process.env.ZAI_API_KEY;

if (!apiKey) {
  console.error("⚠️  Set ZAI_API_KEY before running this script.");
  process.exit(1);
}

console.log(`\n▶️  Testing Z.ai model: ${model}`);
console.log(`   Prompt: ${topic}`);
console.log(`   Temperature: ${temperature}`);

const prompt = `You are a newsroom assistant. Always answer using the separators below, cite facts with URLs, and keep tone professional.\n\n` +
  `|||HEADLINE|||\n` +
  `Short, snappy headline\n` +
  `|||BODY|||\n` +
  `Two medium paragraphs in Markdown summarizing the latest context\n` +
  `|||SOURCES|||\n` +
  `Strict JSON array like [{"title":"","url":""}] covering every cited reference.`;

const payload = {
  model,
  temperature,
  max_tokens: 1024,
  messages: [
    { role: "system", content: "You are an investigative news generator." },
    { role: "user", content: `${prompt}\n\nTOPIC: ${topic}` }
  ]
};

try {
  const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const text = choice?.message?.content || "";

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

  console.log("\n✅ Z.ai request finished without transport errors.\n");
} catch (error) {
  console.error("\n❌ Z.ai request failed:");
  console.error(error.message || error);
  process.exit(1);
}
