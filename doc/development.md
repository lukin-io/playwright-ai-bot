# Development Guide

This file explains how to extend and maintain the bot and analysis pipeline.

## Project structure

- `bot/` – Playwright browser automation.
  - `login.ts` – logs in and saves session to `data/session/neverlands.json`.
  - `crawl.ts` – uses the session to visit screens and write `data/raw/*.html` + `*.png`.
- `analyzer/` – analysis scripts.
  - `analyzeScreens.ts` – sends HTML snapshots to OpenAI using `promt.md` as the system prompt.
- `data/` – generated artefacts (sessions, snapshots, analysis).
- Root docs: `bot.md` (original idea), `promt.md` (analysis prompt), `AGENTS.md` (contributor guide).

## Extending the crawler

- Add more entries to the `screens` array in `bot/crawl.ts` for new game areas.
- If navigation requires clicks instead of direct URLs, you can:
  - Start from the home screen.
  - Use `page.click()` on key UI elements before capturing HTML.
- Keep an eye on rate-limiting and ToS; do not hammer the server.

## Extending analysis

- Adjust `promt.md` to:
  - Add new fields (e.g., monetization risk, UX notes).
  - Focus on specific systems (e.g., crafting, PvP, events).
- Add additional scripts to:
  - Convert JSON in `data/analysis/` into Markdown under `docs/inspiration/`.
  - Aggregate multiple runs for comparison.

## Testing and safety

- Prefer local mocks/fakes instead of hitting neverlands.ru in automated tests.
- Never hardcode credentials in the repo; keep them in env vars or ignored config files.
- Always respect the game’s Terms of Service and use this tooling only on your own account.

