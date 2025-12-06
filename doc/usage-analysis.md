# Analyzing HTML Snapshots

This guide covers how HTML snapshots are analysed with GPT using `promt.md`.

## Prompt template

- `promt.md` defines the system behaviour:
  - Role: game design analyst.
  - Goals: identify visible systems/features, describe them, map to player needs.
  - Output: JSON array with fields like `feature`, `location`, `description`, `player_need`, `adaptation_idea`.

`analyzer/analyzeScreens.ts` reads `promt.md` and sends it to OpenAI as the system message.

## Running analysis

After you have snapshots in `data/raw/`:

```bash
npm run analyze
```

The script will:

- Look for all `*.html` files in `data/raw/`.
- For each file, send the HTML together with the prompt to the OpenAI Chat Completions API.
- Request JSON-only output (`response_format: json_object`).
- Save the result to `data/analysis/<id>-<hash>.json`.

## Using the results

- Open the JSON files to see extracted features and systems.
- You can post-process them into Markdown design notes, spreadsheets, or a small database.
- Typical uses:
  - Compare systems across games.
  - Build a library of “inspiration cards” for your own MMORPG.

