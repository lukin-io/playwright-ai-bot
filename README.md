# Neverlands Browser Bot & GPT Analyst

This project is a "browser bot + GPT analyst" pipeline for inspecting browser MMORPGs (specifically neverlands.ru) and turning real HTML game screens into structured game-design insights.

The high-level flow:

1. Use Playwright to log in to neverlands.ru with your own account.
2. Reuse the authenticated session to visit key game screens and save HTML + screenshots.
3. Send the HTML snapshots to OpenAI (gpt-5.1) using a specialised prompt (`promt.md`).
4. Store the model output as JSON for further reading, tagging, or converting into design notes.

No credentials are ever sent to GPT: only HTML snapshots are analysed.

---

## Project Structure

- `bot/` – Playwright browser automation.
  - `login.ts` – logs in to neverlands.ru and saves session to `data/session/neverlands.json`.
  - `crawl.ts` – uses the saved session to visit screens and write `data/raw/*.html` + `*.png`.
- `analyzer/` – analysis scripts.
  - `analyzeScreens.ts` – sends HTML snapshots to OpenAI using `promt.md` as the system prompt.
- `data/` – generated artefacts (sessions, snapshots, analysis).
- `doc/` – detailed documentation (overview, setup, usage, development).
- Root docs:
  - `bot.md` – original ChatGPT explanation of the architecture.
  - `promt.md` – prompt template for the game-design analysis.
  - `AGENTS.md` – contributor guidelines.

---

## Installation & Setup

### Prerequisites

- Node.js 18+ (required for built-in `fetch`).
- `npm` installed.

### Install dependencies

From the repository root:

```bash
npm install
npx playwright install chromium
```

### Environment configuration (.env)

This project uses `dotenv` to load configuration from a local `.env` file.

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your real values:

   ```dotenv
   NEVERLANDS_USERNAME=your_login
   NEVERLANDS_PASSWORD=your_password
   OPENAI_API_KEY=sk-proj-...        # your real API key
   ```

3. Adjust selectors to match the real neverlands.ru login form in your browser (DevTools → Elements). For the current HTML structure, these defaults usually work:

   ```dotenv
   NEVERLANDS_USERNAME_SELECTOR=input[name='player_nick']
   NEVERLANDS_PASSWORD_SELECTOR=#real
   ```

4. Optional: override URLs or the model if needed:

   ```dotenv
   NEVERLANDS_LOGIN_URL=http://www.neverlands.ru/
   NEVERLANDS_HOME_URL=http://www.neverlands.ru/
   OPENAI_MODEL=gpt-5.1
   ```

Your `.env` file should never be committed to version control.

---

## Using the Bot

### 1. Configure login selectors

1. Open neverlands.ru in your browser.
2. Inspect the login form with DevTools.
3. Confirm the username and password fields:
   - Username: `input[name='player_nick']`
   - Fake password field: `#temp` (handled automatically by the script)
   - Real password field: `#real` (`name="player_password"`)
4. Set or adjust selectors in `.env` only if the HTML changes. A typical setup is:

   ```dotenv
   NEVERLANDS_USERNAME_SELECTOR=input[name='player_nick']
   NEVERLANDS_PASSWORD_SELECTOR=#real
   ```

### 2. Run the login flow

```bash
npm run login
```

This will:

- Launch Chromium (non-headless).
- Open `NEVERLANDS_LOGIN_URL` (normalized to `http://www.neverlands.ru/` if needed).
- Fill `NEVERLANDS_USERNAME` into `player_nick`.
- Click the fake password field `#temp`, reveal `#real`, and fill `NEVERLANDS_PASSWORD` there.
- Submit the form by pressing Enter on the real password field.
- Save an authenticated storage state to `data/session/neverlands.json`.

If selectors are wrong or the page changes, Playwright will throw; fix selectors and retry.

### 3. Capture game screens

Edit `bot/crawl.ts` to list the screens you want to analyse. For example:

```ts
const screens: ScreenConfig[] = [
  { id: "home", url: normalizeNeverlandsUrl(process.env.NEVERLANDS_HOME_URL) },
  { id: "inventory", url: "http://www.neverlands.ru/?page=inventory" },
  { id: "character", url: "http://www.neverlands.ru/?page=character" },
  { id: "shop", url: "http://www.neverlands.ru/?page=shop" }
];
```

Then run:

```bash
npm run crawl
```

For each configured screen, the bot will:

- Navigate using the saved session.
- Save HTML to `data/raw/<id>.html`.
- Save a screenshot to `data/raw/<id>.png`.

---

## Analyzing HTML Snapshots

### Prompt template (promt.md)

- `promt.md` defines the system behaviour:
  - Role: game design analyst.
  - Goals: identify visible systems/features, describe them, map to player needs.
  - Output: JSON array with fields like `feature`, `location`, `description`, `player_need`, `adaptation_idea`.

`analyzer/analyzeScreens.ts` reads `promt.md` and sends it to OpenAI as the system message.

### Run analysis

After you have snapshots in `data/raw/`:

```bash
npm run analyze
```

The script will:

- Look for all `*.html` files in `data/raw/`.
- For each file, send the HTML together with the prompt to the OpenAI Chat Completions API.
- Use `OPENAI_MODEL` (default `gpt-5.1`) and request JSON-only output (`response_format: json_object`).
- Save the result to `data/analysis/<id>-<hash>.json`.

### Using the results

- Open the JSON files in `data/analysis/` to see extracted features and systems.
- You can post-process them into Markdown design notes, spreadsheets, or a small database.
- Typical uses:
  - Compare systems across games.
  - Build a library of “inspiration cards” for your own MMORPG.

---

## Development & Extension

### Extending the crawler

- Add more entries to the `screens` array in `bot/crawl.ts` for new game areas.
- If navigation requires clicks instead of direct URLs, you can:
  - Start from the home screen.
  - Use `page.click()` on key UI elements before capturing HTML.
- Keep the list of screens small and focused while experimenting to avoid unnecessary load.

### Extending analysis

- Adjust `promt.md` to:
  - Add new fields (e.g., monetization risk, UX notes, event cadence).
  - Focus on specific systems (e.g., crafting, PvP, events, shop).
- Add additional scripts to:
  - Convert JSON in `data/analysis/` into Markdown under `docs/inspiration/`.
  - Aggregate multiple runs for longitudinal comparisons.

### Commands

- `npm run login` – perform login and save session.
- `npm run crawl` – capture configured screens into `data/raw/`.
- `npm run analyze` – analyze snapshots with GPT.
- `npm run start` – run login → crawl → analyze in sequence.

---

## Security, Safety & ToS

- Use this bot only on your own neverlands.ru account.
- Store credentials only in `.env` on your machine; never commit them.
- The bot is designed for UX/system analysis, not automated gameplay or farming.
- Always respect the game’s Terms of Service and keep crawl rates conservative.

For more detailed information, see the documents in the `doc/` folder.
