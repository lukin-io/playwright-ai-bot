# Implemented Bot Features

This document summarizes what is already implemented for the bot and analysis pipeline.

## Core features

- **Playwright login** (`bot/login.ts`):
  - Logs in to neverlands.ru using credentials from environment variables.
  - Uses configurable CSS selectors for username, password, and submit.
  - Saves Playwright storage state to `data/session/neverlands.json`.

- **Authenticated crawl** (`bot/crawl.ts`):
  - Reuses the stored session to open specific game screens.
  - Saves each screen’s DOM to `data/raw/<id>.html`.
  - Saves full-page screenshots to `data/raw/<id>.png`.

- **GPT-based analysis** (`analyzer/analyzeScreens.ts`):
  - Reads `promt.md` as the system prompt.
  - Sends each HTML snapshot to the OpenAI Chat Completions API.
  - Requests JSON-only output describing game systems and player needs.
  - Stores the results in `data/analysis/*.json`.

## Commands

- `npm run login` – perform login and save session.
- `npm run crawl` – capture configured screens into `data/raw/`.
- `npm run analyze` – analyze snapshots with GPT.
- `npm run start` – run login → crawl → analyze in sequence.

## Limitations & TODOs

- Login selectors for neverlands.ru must be configured manually; defaults are placeholders.
- No rate limiting or scheduling is implemented; long-running crawls should be run carefully.
- Analysis currently writes raw JSON only; higher-level Markdown or dashboards are left for future development.

