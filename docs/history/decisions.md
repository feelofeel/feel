---
title: FEEL Decision Index
id: decisions
role: log
status: living
doc_revision: 1
feel_version: "1.1"
updated: 2026-06-25
source_of: []
derived_from: []
---

# FEEL — Decision Index

A **thin, append-only, skill-only** breadcrumb trail of non-obvious framework choices. **Only `/feel-decision` writes this file — never hand-edit it.** Substance lives in the "codified in" doc; once a decision is fully absorbed there its row is **pruned** (git keeps the history). Full rule: [`conventions/feel.md`](../conventions/feel.md) §6.

---

## Inception (2026-06-25)

| Date | Decision | Codified in |
|---|---|---|
| 2026-06-25 | FEEL separated from FEFO into its own repo; copy-on-adopt (not submodule/subtree) chosen for Phase 1 because it keeps each project fully independent with no tooling overhead | feel-adoption.md §1 (L1–L2 are the portable artifact) |
| 2026-06-25 | Projects track FEEL version via `.fefo/feel.lock` (or equivalent) and a sync comment in their `docs/conventions/feel.md` copy; no forced upgrade path | feel-adoption.md §2 adoption steps |
| 2026-06-25 | npm publishing deferred to Phase 2 (gate: 3+ weeks stable across FEFO + Landing); v0.1.0 is pre-publish baseline | CLAUDE.md sticky facts (Phase 2 gate) |
