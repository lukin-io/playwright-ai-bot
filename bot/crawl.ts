import "dotenv/config";
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

type ScreenConfig = {
  id: string;
  url: string;
};

const storagePath = path.join("data", "session", "neverlands.json");

function normalizeNeverlandsUrl(raw?: string): string {
  if (!raw) return "http://www.neverlands.ru/";

  let url = raw.trim();

  if (url.startsWith("https://neverlands.ru")) {
    url = url.replace("https://neverlands.ru", "http://www.neverlands.ru");
  } else if (url.startsWith("https://www.neverlands.ru")) {
    url = url.replace("https://www.neverlands.ru", "http://www.neverlands.ru");
  } else if (url.startsWith("http://neverlands.ru")) {
    url = url.replace("http://neverlands.ru", "http://www.neverlands.ru");
  }

  return url;
}

const screens: ScreenConfig[] = [
  { id: "home", url: normalizeNeverlandsUrl(process.env.NEVERLANDS_HOME_URL) }
];

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function main() {
  if (!fs.existsSync(storagePath)) {
    console.error("Storage state not found. Run `npm run login` first.");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: storagePath });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);

  const rawDir = path.join("data", "raw");
  await ensureDir(rawDir);

  for (const screen of screens) {
    console.log("Visiting", screen.id, "->", screen.url);
    await page.goto(screen.url, { waitUntil: "domcontentloaded" });
    // Give the page a moment to settle dynamic content
    await page.waitForTimeout(3000);

    const html = await page.content();
    const htmlPath = path.join(rawDir, `${screen.id}.html`);
    const pngPath = path.join(rawDir, `${screen.id}.png`);

    await fs.promises.writeFile(htmlPath, html, "utf8");
    await page.screenshot({ path: pngPath, fullPage: true });

    console.log("Saved", htmlPath, "and", pngPath);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
