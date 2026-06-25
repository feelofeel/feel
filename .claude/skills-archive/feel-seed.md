---
description: Seal the current session by writing a compact token-and-outcome seed to .feel/seeds/. Seeds power feel-health without re-parsing all JSONL history. Triggers on /feel-seed or any mention of "seal the session", "save session seed", "close the session", "session summary to disk", "save token stats".
---

# feel-seed — seal a session's token and outcome record

Writes a compact JSON seed for the current session to `.feel/seeds/<sessionId>.json`.
Seeds are ~500 bytes each and persist across sessions, powering the dashboard and
feel-health's observed baselines without expensive JSONL re-parsing.

---

## 1. Find and run the seeder

Run:

```
node tools/usage-dashboard/analyze.mjs --seed-latest
```

If a `$ARGUMENTS` note was provided, append `--note "<note>"`:

```
node tools/usage-dashboard/analyze.mjs --seed-latest --note "brief description"
```

The script finds the most recently modified JSONL session file, extracts token
stats and events, queries git for commits made since the session started, and
writes the seed. It prints a one-line summary on success.

---

## 2. Capture the summary

Read the output line from the command:
```
Session sealed. N turns · $X.XXX est. · cache N% · M commits
→ .feel/seeds/<sessionId>.json
```

Report this line verbatim to the user. No further action needed.

---

## 3. Flag if seed already exists

If the script exits with "Seed already exists", report:
> "Seed for this session already exists. Use `/feel-seed --force` to overwrite,
> or run `/feel-health` to see the dashboard pointer."

To force overwrite, run:
```
node tools/usage-dashboard/analyze.mjs --seed-latest --force --note "<note>"
```

---

## 4. Optionally open the dashboard

If the user asks to see the data, remind them:
> `node tools/usage-dashboard/serve.mjs` opens the browser dashboard.

---

## Contract

**Requires**
- `tools/usage-dashboard/analyze.mjs` exists
- At least one session exists in `~/.claude/projects/`

**Guarantees**
- Exactly one seed file is written to `.feel/seeds/<sessionId>.json`
- Prints a 2-line summary: stats line + file path
- Never overwrites an existing seed without `--force`

**Never**
- Reads or edits source files, docs, or migrations
- Writes anything outside `.feel/seeds/`
- Commits the seed file (seeds are `.gitignore`d)

---

## Argument

`$ARGUMENTS` — optional one-line note describing what this session accomplished.
Examples:
- `/feel-seed "shipped shelf-life fix"`
- `/feel-seed "dashboard MVP complete"`
- `/feel-seed` — auto-note from first user message
