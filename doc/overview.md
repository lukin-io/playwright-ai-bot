# Overview

This project is a "browser bot + GPT analyst" pipeline for inspecting browser MMORPGs (such as neverlands.ru) and turning real HTML screens into structured game-design insights.

The flow is:

1. Use Playwright to log in to the game with your own account.
2. Reuse the authenticated session to visit key game screens and save HTML + screenshots.
3. Send the HTML snapshots to OpenAI with a specialised prompt (see `promt.md`).
4. Store the model output as JSON for further reading, tagging, or converting into design notes.

No credentials are ever sent to GPT: only HTML snapshots are analysed.

