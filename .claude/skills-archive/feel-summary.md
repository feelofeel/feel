---
description: Print a compact project repo snapshot (architecture tree, dependencies, API routes, migration status, scripts) by running tools/ai-context/repo-summary.mjs. Triggers on /feel-summary or any mention of "repo summary", "project snapshot", "what's the structure", "onboarding overview".
---

# FEEL repo summary

A thin wrapper over `tools/ai-context/repo-summary.mjs` — a read-only snapshot for orienting fast (onboarding, pre-change context) without hand-reading the tree. It calls no network, opens no browser, and changes nothing.

## 1. Run it

From the repo root:

```bash
node tools/ai-context/repo-summary.mjs
```

## 2. Read the output

A compact architecture tree, package/dependency summary, API route list, migration status (001–NNN applied), operational scripts, and the guardrail docs.

## 3. Route from it

Pair the snapshot with the **change-type router in `CLAUDE.md`** to pick the smallest reading bucket for the task at hand.

## Argument

`$ARGUMENTS` — none required; the script takes no mandatory args. Pass through any flags the script supports if asked.
