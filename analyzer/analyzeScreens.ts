import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("Set OPENAI_API_KEY environment variable for analysis.");
  process.exit(1);
}

const model = process.env.OPENAI_MODEL || "gpt-5.1";

async function readPromptTemplate() {
  const promptPath = path.join(process.cwd(), "promt.md");
  const content = await fs.promises.readFile(promptPath, "utf8");
  return content.trim();
}

async function listHtmlSnapshots(dir: string) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => path.join(dir, e.name));
}

async function callOpenAI(prompt: string, html: string) {
  const body = {
    model,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: `Here is an HTML snapshot of a browser MMORPG screen. Analyze it according to the instructions and respond with JSON only.\n\n${html}`
      }
    ],
    response_format: { type: "json_object" }
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${text}`);
  }

  const json = (await response.json()) as any;
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected OpenAI response format");
  }

  return content.trim();
}

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function main() {
  const rawDir = path.join("data", "raw");
  if (!fs.existsSync(rawDir)) {
    console.error("No raw HTML found. Run `npm run crawl` first.");
    process.exit(1);
  }

  const outDir = path.join("data", "analysis");
  await ensureDir(outDir);

  const prompt = await readPromptTemplate();
  const files = await listHtmlSnapshots(rawDir);

  if (files.length === 0) {
    console.error("No .html snapshots found in", rawDir);
    process.exit(1);
  }

  for (const file of files) {
    const html = await fs.promises.readFile(file, "utf8");
    const base = path.basename(file, ".html");
    const hash = crypto.createHash("sha1").update(html).digest("hex").slice(0, 8);
    const outPath = path.join(outDir, `${base}-${hash}.json`);

    console.log("Analyzing", file, "->", outPath);

    try {
      const content = await callOpenAI(prompt, html);
      await fs.promises.writeFile(outPath, content, "utf8");
    } catch (error) {
      console.error("Failed to analyze", file, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
