---
title: FEEL Decision Index
id: decisions
role: log
status: living
doc_revision: 3
feel_version: "1.5"
updated: 2026-08-03
source_of: []
derived_from: []
---

# FEEL — Decision Index

A **skill-only** breadcrumb trail of non-obvious framework choices. **Only `/feel-decision` writes this file.** Append works everywhere; pruning requires durable history and human approval. Full rule: [`conventions/feel.md`](../conventions/feel.md) §6.

---

## Inception (2026-06-25)

| Date | Decision | Codified in |
|---|---|---|
| 2026-06-25 | FEEL separated from FEFO into its own repo; copy-on-adopt (not submodule/subtree) chosen for Phase 1 because it keeps each project fully independent with no tooling overhead | feel-adoption.md §1 (L1–L2 are the portable artifact) |
| 2026-06-25 | Projects track FEEL version via `.fefo/feel.lock` (or equivalent) and a sync comment in their `docs/conventions/feel.md` copy; no forced upgrade path | feel-adoption.md §2 adoption steps |
| 2026-06-25 | npm publishing deferred to Phase 2 (gate: 3+ weeks stable across FEFO + Landing); v0.1.0 is pre-publish baseline | CLAUDE.md sticky facts (Phase 2 gate) |

## Capability-aware core (2026-07-17)

| Date | Decision | Codified in |
|---|---|---|
| 2026-07-17 | Git/history, changelogs, trackers, and plan docs are preferred capabilities rather than core prerequisites; without durable history decisions remain append-only and pruning is disabled | feel.md §6 and feel-adoption.md §3 |
| 2026-07-17 | `.feel/feel.lock` supersedes the original host-specific lock path as the portable FEEL version pin | feel-adoption.md §2 and tools/install.mjs |

## FEEL 1.5 — reader-need metadata (2026-08-03)

| Date | Decision | Codified in |
|---|---|---|
| 2026-08-03 | FEEL heads are variable-length blocks read through the closing delimiter; Diátaxis is an optional reader-need dimension, required only when a configured publication contract says so, and never replaces FEEL roles | feel.md §1 and §5 |
