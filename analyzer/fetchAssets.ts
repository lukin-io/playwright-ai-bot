import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

const baseUrl = process.env.NEVERLANDS_BASE_URL || "http://www.neverlands.ru";
const rawDir = path.join("data", "raw");
const assetsDir = path.join("data", "assets");

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function resolveUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  if (!href.startsWith("/")) return `${baseUrl}/${href}`;
  return `${baseUrl}${href}`;
}

async function readMainFrameHtml(): Promise<string> {
  const candidates = [
    "frame-main_top.html",
    "frame-main_top_.html",
    "frame-main_top_f.html"
  ];

  for (const name of candidates) {
    const p = path.join(rawDir, name);
    if (fs.existsSync(p)) {
      return fs.promises.readFile(p, "utf8");
    }
  }

  throw new Error(
    `Could not find main frame HTML in ${rawDir}. Expected one of: ${candidates.join(", ")}`
  );
}

function extractAssets(html: string) {
  const css: string[] = [];
  const js: string[] = [];

  const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(html))) {
    css.push(m[1]);
  }

  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi;
  while ((m = scriptRegex.exec(html))) {
    js.push(m[1]);
  }

  return { css, js };
}

async function downloadAsset(url: string, targetPath: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "<no body>");
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
  }

  const text = await res.text();
  await ensureDir(path.dirname(targetPath));
  await fs.promises.writeFile(targetPath, text, "utf8");
}

export async function fetchAssetsForMainFrame() {
  console.log("Base URL for assets:", baseUrl);
  console.log("Reading main frame HTML from", rawDir);

  const html = await readMainFrameHtml();
  const { css, js } = extractAssets(html);

  console.log("Found CSS hrefs:", css);
  console.log("Found JS srcs:", js);

  const uniqueCss = Array.from(new Set(css));
  const uniqueJs = Array.from(new Set(js));

  console.log("Downloading CSS files...");
  for (const href of uniqueCss) {
    const url = resolveUrl(href);
    const relPath = href.startsWith("/") ? href.slice(1) : href;
    const targetPath = path.join(assetsDir, relPath);
    console.log("CSS:", url, "->", targetPath);
    try {
      await downloadAsset(url, targetPath);
    } catch (err) {
      console.error("Failed to download CSS", url, err);
    }
  }

  console.log("Downloading JS files...");
  for (const src of uniqueJs) {
    const url = resolveUrl(src);
    const relPath = src.startsWith("/") ? src.slice(1) : src;
    const targetPath = path.join(assetsDir, relPath);
    console.log("JS:", url, "->", targetPath);
    try {
      await downloadAsset(url, targetPath);
    } catch (err) {
      console.error("Failed to download JS", url, err);
    }
  }

  console.log("Asset fetch complete. Assets stored under", assetsDir);
}

if (require.main === module) {
  fetchAssetsForMainFrame().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
