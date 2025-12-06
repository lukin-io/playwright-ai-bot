# Repository Guidelines

This repository focuses on a "browser bot + GPT analyst" workflow for inspecting browser MMORPGs and turning UI snapshots into structured design insights.

## Project Structure & Module Organization

- `bot/`: browser automation (e.g., `login.ts`, `crawl.ts`) using Playwright or similar.
- `analyzer/`: scripts that read HTML/PNG from `data/raw/`, call the OpenAI API, and write JSON/Markdown.
- `data/raw/`: captured DOM and screenshots, organized by feature or screen.
- `docs/inspiration/`: generated design notes (e.g., `character_screen.md`, `crafting_systems.md`).
- Root docs (`bot.md`, `promt.md`): reference architecture, prompts, and usage tips.

## Build, Test, and Development Commands

- `npm install`: install Node/TypeScript dependencies for automation and analysis scripts.
- `npm run crawl`: execute the browser bot to log in, visit key screens, and populate `data/raw/`.
- `npm test`: run the test suite for automation and analysis modules.
- `npm run lint` / `npm run format`: apply linting and formatting to keep the codebase consistent.
Keep `package.json` scripts aligned with these names when adding new tooling.

## Coding Style & Naming Conventions

- Language: prefer TypeScript for `bot/` and `analyzer/`.
- Indentation: 2 spaces; no tabs.
- Naming: camelCase for variables/functions, PascalCase for classes, kebab-case for filenames.
- Prompts: store reusable prompt templates (like `promt.md`) under a dedicated `prompts/` or docs directory.

## Testing Guidelines

- Framework: Jest, Vitest, or equivalent for TypeScript.
- Location: mirror source layout under `tests/` (e.g., `tests/bot/login.spec.ts`).
- Scope: cover navigation logic, DOM extraction, file I/O, and prompt construction; do not hit real game servers in tests.
- Use environment-based configuration and mocks/fakes for credentials and HTTP.

## Commit & Pull Request Guidelines

- Commits: use clear, action-oriented messages (e.g., `feat: add crawl pipeline`, `fix: stabilize login flow`).
- PRs: include a short summary, affected directories, and example commands (`npm run crawl`, `npm test`).
- Link related issues and, when relevant, attach sample output (e.g., snippets from `docs/inspiration/`).

## Security & Configuration

- Never commit credentials, cookies, or raw sessions; keep them in `.env` or secure stores and add sensitive paths to `.gitignore`.
- Respect each game’s Terms of Service and keep automation rates conservative.
- Treat this tooling as an analysis aid, not as a gameplay bot.

