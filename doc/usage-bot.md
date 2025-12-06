# Using the Bot (Login & Crawl)

This guide explains how to log in to neverlands.ru and capture HTML snapshots.

## 1. Configure login selectors

1. Open neverlands.ru in your browser.
2. Inspect the login form with DevTools.
3. Confirm the login fields:
   - Username: `input[name='player_nick']`
   - Fake password field: `#temp` (clicking it reveals the real field)
   - Real password field: `#real` (`name="player_password"`)
4. In most cases you can rely on the defaults from `.env`:

   ```dotenv
   NEVERLANDS_USERNAME_SELECTOR=input[name='player_nick']
   NEVERLANDS_PASSWORD_SELECTOR=#real
   ```

If the HTML changes, update these selectors in `.env` and rerun `npm run login`.

## 2. Run the login flow

```bash
npm run login
```

This will:

- Launch Chromium (non-headless).
- Open `NEVERLANDS_LOGIN_URL`.
- Fill `NEVERLANDS_USERNAME` into the `player_nick` field.
- Click `#temp` to reveal the real password field `#real` and fill `NEVERLANDS_PASSWORD` there.
- Submit the form by pressing Enter on the password field.
- Save an authenticated storage state to `data/session/neverlands.json`.

If selectors are wrong, Playwright will throw; fix them and retry.

## 3. Capture game screens

Edit `bot/crawl.ts` to list the screens you want:

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

You can also run the full pipeline (login → crawl → analyze) in one go with:

```bash
npm run start
```
