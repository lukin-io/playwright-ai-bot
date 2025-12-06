import "dotenv/config";
import { chromium, Page } from "playwright";
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

async function maybeLoginInline(page: Page, homeUrl: string) {
  const username = process.env.NEVERLANDS_USERNAME;
  const password = process.env.NEVERLANDS_PASSWORD;

  if (!username || !password) {
    console.warn(
      "NEVERLANDS_USERNAME or NEVERLANDS_PASSWORD not set; cannot perform inline login."
    );
    return;
  }

  const loginFormCount = await page.locator("#login_form").count();
  if (loginFormCount === 0) {
    console.log("Inline login: #login_form not found; assuming already logged in.");
    return;
  }

  console.log("Inline login: login form detected, attempting to log in.");

  const usernameSelector =
    process.env.NEVERLANDS_USERNAME_SELECTOR || "input[name='player_nick']";
  const configuredPasswordSelector = process.env.NEVERLANDS_PASSWORD_SELECTOR;
  const tempPasswordSelector = "#temp";

  // Fill username
  console.log("Inline login: filling username using selector:", usernameSelector);
  await page.fill(usernameSelector, username);

  // Handle fake password field
  const tempLocator = page.locator(tempPasswordSelector);
  await tempLocator.waitFor({ state: "visible" });
  await tempLocator.click();

  const passwordSelectors = [configuredPasswordSelector, "#real"].filter(
    (s): s is string => !!s && s.trim().length > 0
  );

  let filledPassword = false;
  let usedPasswordSelector: string | null = null;
  for (const selector of passwordSelectors) {
    try {
      const locator = page.locator(selector);
      console.log("Inline login: attempting password selector:", selector);
      await locator.waitFor({ state: "visible", timeout: 2000 });
      await locator.fill(password);
      filledPassword = true;
      usedPasswordSelector = selector;
      console.log("Inline login: filled password using selector:", selector);
      break;
    } catch {
      // try next selector
    }
  }

  if (!filledPassword || !usedPasswordSelector) {
    console.warn(
      "Inline login: could not find password field. Tried:",
      passwordSelectors.join(", ")
    );
    return;
  }

  // Submit by pressing Enter
  console.log(
    "Inline login: pressing Enter on password field:",
    usedPasswordSelector
  );
  const passwordLocator = page.locator(usedPasswordSelector);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    passwordLocator.press("Enter")
  ]);

  await page.waitForTimeout(2000);
  console.log("Inline login: navigation after Enter complete, navigating to homeUrl:", homeUrl);
  await page.goto(homeUrl, { waitUntil: "domcontentloaded" });

  const stillLogin = await page.locator("#login_form").count();
  if (stillLogin > 0) {
    console.warn(
      "Inline login: login form still present after navigation; login may have failed."
    );
  } else {
    console.log("Inline login: login form not present; assuming login succeeded.");
  }
}

async function main() {
  if (!fs.existsSync(storagePath)) {
    console.error("Storage state not found. Run `npm run login` first.");
    process.exit(1);
  }

  const useScreenshots =
    (process.env.USE_SCREENSHOTS || "true").toLowerCase() !== "false";

  console.log("Starting crawl with storage state:", storagePath);
  console.log("Screenshots enabled:", useScreenshots);

  const browser = await chromium.launch({ headless: true });
  console.log("Browser launched (headless)");

  const context = await browser.newContext({ storageState: storagePath });
  console.log("Context created with saved session");

  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  console.log("New page opened, default navigation timeout set to 60000ms");

  // Mirror page console output into Node console for debugging
  page.on("console", (msg) => {
    try {
      console.log("[page console]", msg.type(), msg.text());
    } catch {
      // ignore logging errors
    }
  });

  const rawDir = path.join("data", "raw");
  await ensureDir(rawDir);
  console.log("Ensured raw output directory:", rawDir);

  for (const screen of screens) {
    console.log("Visiting", screen.id, "->", screen.url);

    try {
      console.log("[", screen.id, "] navigating to URL...");
      await page.goto(screen.url, { waitUntil: "domcontentloaded" });
      console.log("[", screen.id, "] DOM content loaded at", page.url());

      // Give the page a moment to settle dynamic content
      await page.waitForTimeout(3000);
      console.log("[", screen.id, "] waitForTimeout(3000) completed");

      const html = await page.content();
      const htmlPath = path.join(rawDir, `${screen.id}.html`);
      const pngPath = path.join(rawDir, `${screen.id}.png`);

      console.log("[", screen.id, "] saving HTML to", htmlPath);
      await fs.promises.writeFile(htmlPath, html, "utf8");

      if (useScreenshots) {
        console.log("[", screen.id, "] taking screenshot to", pngPath);
        try {
          await page.screenshot({
            path: pngPath,
            fullPage: true,
            timeout: 15000
          });
          console.log("[", screen.id, "] screenshot saved.");
        } catch (screenshotError) {
          console.warn(
            "[",
            screen.id,
            "] screenshot failed, continuing without screenshot:",
            screenshotError
          );
        }
      } else {
        console.log(
          "[",
          screen.id,
          "] USE_SCREENSHOTS is false, skipping screenshot."
        );
      }

      console.log("[", screen.id, "] Saved HTML (and screenshot if enabled).");
    } catch (err) {
      console.error("[", screen.id, "] Error during crawl:", err);
    }
  }

  await browser.close();
  console.log("Browser closed. Crawl finished.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
