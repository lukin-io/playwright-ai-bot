# Installation & Setup

## Prerequisites

- Node.js 18+ (required for built-in `fetch`).
- `npm` installed.

## Install dependencies

From the repository root:

```bash
npm install
npx playwright install chromium
```

## Environment configuration (.env)

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
   NEVERLANDS_SUBMIT_SELECTOR=#ent_button
   ```

4. Optional: override URLs or the model if needed:

   ```dotenv
   NEVERLANDS_LOGIN_URL=http://www.neverlands.ru/          # login page
   NEVERLANDS_HOME_URL=http://www.neverlands.ru/game.php   # in-game view after login
   OPENAI_MODEL=gpt-5.1
   USE_SCREENSHOTS=true        # set to false to skip screenshots
   ```

Your `.env` file should **never** be committed to version control.
