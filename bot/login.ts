import "dotenv/config";
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fetchAssetsForMainFrame } from "../analyzer/fetchAssets";

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

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

async function main() {
  const username = process.env.NEVERLANDS_USERNAME;
  const password = process.env.NEVERLANDS_PASSWORD;

  if (!username || !password) {
    console.error("Set NEVERLANDS_USERNAME and NEVERLANDS_PASSWORD environment variables.");
    process.exit(1);
  }

  const loginUrl = normalizeNeverlandsUrl(process.env.NEVERLANDS_LOGIN_URL);

  const configuredUsernameSelector = process.env.NEVERLANDS_USERNAME_SELECTOR;
  const configuredPasswordSelector = process.env.NEVERLANDS_PASSWORD_SELECTOR;
  const tempPasswordSelector = "#temp";

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Using loginUrl:", loginUrl);
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

  // Wait for the login form and fill username
  await page.waitForSelector("#auth_form");

  // Try configured selector first, then known Neverlands selector as a fallback
  const usernameSelectors = [
    configuredUsernameSelector,
    "input[name='player_nick']"
  ].filter((s): s is string => !!s && s.trim().length > 0);

  let filledUsername = false;
  for (const selector of usernameSelectors) {
    try {
      const locator = page.locator(selector);
      if ((await locator.count()) > 0) {
        console.log("Filling username using selector:", selector);
        await locator.fill(username);
        filledUsername = true;
        break;
      }
    } catch (e) {
      // ignore and try next selector
    }
  }

  if (!filledUsername) {
    throw new Error(
      "Could not find username field. Tried: " + usernameSelectors.join(", ")
    );
  }

  // Handle Neverlands' fake password field (#temp) that reveals the real one (#real)
  const tempLocator = page.locator(tempPasswordSelector);
  console.log("Clicking temp password field:", tempPasswordSelector);
  await tempLocator.waitFor({ state: "visible" });
  await tempLocator.click();

  // Try configured password selector first, then the known #real field
  const passwordSelectors = [configuredPasswordSelector, "#real"].filter(
    (s): s is string => !!s && s.trim().length > 0
  );

  let filledPassword = false;
  let usedPasswordSelector: string | null = null;
  for (const selector of passwordSelectors) {
    try {
      const locator = page.locator(selector);
      console.log("Attempting to fill password using selector:", selector);
      await locator.waitFor({ state: "visible", timeout: 2000 });
      await locator.fill(password);
      filledPassword = true;
      usedPasswordSelector = selector;
      console.log("Filled password using selector:", selector);
      break;
    } catch {
      // try next selector
    }
  }

  if (!filledPassword) {
    throw new Error(
      "Could not find password field. Tried: " + passwordSelectors.join(", ")
    );
  }

  // Submit the form by pressing Enter on the password field
  if (usedPasswordSelector) {
    const passwordLocator = page.locator(usedPasswordSelector);
    console.log(
      "Pressing Enter on password field to submit form:",
      usedPasswordSelector
    );

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      passwordLocator.press("Enter")
    ]);
  }

  // Give the game a short moment to settle after navigation
  await page.waitForTimeout(3000);

  // Capture the current page HTML as the "home" snapshot
  const rawDir = path.join("data", "raw");
  await ensureDir(rawDir);
  const homeHtmlPath = path.join(rawDir, "home.html");
  console.log("Saving post-login HTML to", homeHtmlPath);
  const html = await page.content();
  await fs.promises.writeFile(homeHtmlPath, html, "utf8");

  // Additionally capture the main game frame that game.js/view_frames() creates.
  // We treat the frame named "main_top" (main.php) as the primary game UI.
  const frames = page.frames();
  const mainFrame = frames.find(
    (f) => f.name() === "main_top" || f.url().includes("/main.php")
  );

  if (!mainFrame) {
    console.warn(
      "No frame named 'main_top' or URL containing '/main.php' found after login."
    );
  } else {
    const frameUrl = mainFrame.url();
    const frameName = mainFrame.name() || "main_top";
    const safeName = frameName.replace(/[^a-zA-Z0-9_-]+/g, "_");
    const framePath = path.join(rawDir, `frame-${safeName}.html`);

    try {
      console.log(
        "Saving main game frame name=",
        frameName,
        "url=",
        frameUrl,
        "to",
        framePath
      );
      const frameHtml = await mainFrame.content();
      await fs.promises.writeFile(framePath, frameHtml, "utf8");
    } catch (err) {
      console.warn("Failed to capture main game frame HTML:", err);
    }
  }

  // Optionally fetch all CSS/JS assets referenced by the main game frame,
  // so you have a local mirror of styles and scripts.
  try {
    console.log("Fetching CSS/JS assets for main frame...");
    await fetchAssetsForMainFrame();
  } catch (err) {
    console.warn("Failed to fetch assets for main frame:", err);
  }

  const sessionDir = path.join("data", "session");
  await ensureDir(sessionDir);
  const storagePath = path.join(sessionDir, "neverlands.json");
  await context.storageState({ path: storagePath });

  console.log("Login flow completed. Storage state saved to", storagePath);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
