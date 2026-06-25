---
description: Audit project context weight: doc/skill token footprint, role budgets, session freshness, and outlier docs that cost too much. Triggers on /feel-health or any mention of "context load", "token budget", "how heavy is this project", "session pressure", "cognitive load", "which role fits a fresh session", "doc token cost", "project health".
---

# feel-health — project cognitive-load dashboard

A thin wrapper over `tools/feel/health.mjs`. The script does all the counting on
disk — it never loads doc or skill bodies into this context. Read its output and
interpret it; do **not** re-read the files it measured.

> Why a script: feel-health used to read every doc, every skill, and every role's
> code into context and divide by 4 by hand — paying the full token cost of
> "everything loaded" just to estimate it. `chars ÷ 4` is deterministic; the
> script computes it from `fs.stat` + file length and returns only the numbers.

## 1. Run it

```bash
node tools/feel/health.mjs            # full dashboard (default)
node tools/feel/health.mjs --roles    # per-role budget table only
node tools/feel/health.mjs --outliers # outlier docs only
node tools/feel/health.mjs --sizes    # per-doc size table (chars/tokens/headings/flags)
node tools/feel/health.mjs --json     # machine-readable, for chaining
```

Pass the matching flag through from `$ARGUMENTS` (`--roles`, `--outliers`,
`--sizes`); empty → full dashboard. `--session` is handled by the skill in step 3,
not by the script.

It reads `docs/feel.config.yaml` (registry, `roles`, `head_count`), stats every
doc and skill, joins per-role budgets, flags outliers, and folds in observed
baselines from `.feel/seeds/` when present.

## 2. Interpret the output

The script prints the numbers; your job is the one-paragraph read on them:

- **Session floor** is paid every session (CLAUDE.md + always-loaded skill
  descriptions + harness). If it's climbing, the super-index or skill descriptions
  are the lever.
- **Per-role table** — `Rec.` is the doc's `session_recommendation`: `fresh`
  (start at session open), `any`, or `light`. A `fresh` role near or above ~25% of
  the window is the one to start cold.
- **Outliers** — `[heavy doc]` (>10k t), `[shrink cand.]` (>6k t, <3 roles →
  shrink candidate; `/feel-shrink` is archived in `feel/skills/`, reactivate it to
  apply or trim by hand), `[structural]` (>4k t with head-count flags → consider a split
  per `head_count.split_action`). `(exempt)` docs are downgraded — large by design.
- **`Code ~0`** for a role usually means a `required_code` path in the config
  doesn't resolve from repo root — flag it, don't treat it as "no code."

End with 1–2 lines of recommendation, not a restatement of the table.

## 3. Session pressure (`--session`, optional)

If asked mid-session, add a rough note: `git diff --stat` for touched files, sum
their sizes from `--sizes`, add the floor. State plainly that it's an estimate —
real usage depends on conversation history and tool output, not just file reads.

## Contract

**Requires**
- `docs/feel.config.yaml` with `docs`, `roles`, and `head_count` sections
- `tools/feel/health.mjs` present

**Guarantees**
- Counting is done by the script on disk; the skill does not read measured file
  bodies into context
- Every figure is labelled an estimate; outlier flags name the threshold crossed
- Observed baselines appear only when `.feel/seeds/` has entries

**Never**
- Edits any file
- Re-reads doc/skill bodies the script already measured (defeats the purpose)
- Calls `/feel-shrink` automatically (only flags candidates)
- Treats token estimates as hard limits

## Argument

`$ARGUMENTS` — optional: empty → full dashboard; `--roles`, `--outliers`,
`--sizes` → that section only; `--session` → current-session pressure estimate.
