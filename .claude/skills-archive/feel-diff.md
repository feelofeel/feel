---
description: Print the project's changed files, diff stats, and a fenced git diff by running tools/ai-context/diff-extract.mjs. Triggers on /feel-diff or any mention of "show the diff", "what changed", "extract the diff", "diff for review or changelog".
---

# FEEL diff extract

A thin wrapper over `tools/ai-context/diff-extract.mjs` — a read-only diff bundle for review, changelog writing, or PR prep.

## 1. Run it

From the repo root:

```bash
node tools/ai-context/diff-extract.mjs [range]
```

`[range]` is any git diff range — e.g. `main..HEAD`, a commit SHA, or `--staged`. With no range it shows the current working-tree diff.

## 2. Use the output

A changed-file list, diff stat, and a fenced `git diff`. Feed it into the project's changelog skill to classify the SemVer bump, or into a review.

## Contract

**Requires**
- `tools/ai-context/diff-extract.mjs` exists
- A git repository with at least one commit

**Guarantees**
- Output is read-only — changed-file list, diff stat, fenced diff
- No file is written; no command beyond `git diff` is run

**Never**
- Modifies any file
- Stages or commits changes
- Runs any command other than the `diff-extract.mjs` script

## Argument

`$ARGUMENTS` is an optional git diff range (`main..feature`, `--staged`, a commit SHA). If empty, the script shows the working-tree diff.
