---
title: Decision Index
id: decisions
role: log
status: living
doc_revision: 1
app_version: 0.1.0
updated: {{YYYY-MM-DD}}
source_of: []
derived_from: []
---

# {{PROJECT}} — Decision Index

A **thin, append-only, skill-only** breadcrumb trail of non-obvious choices. **Only `/feel-decision` writes this file — never hand-edit it.** It is a short rolling window, not an archive: the substance lives in the "codified in" doc, and once a decision is fully absorbed there its row is **pruned** (git keeps the history). Full rule: [`conventions/feel.md`](../conventions/feel.md) §6.

- **Design rationale** → [`architecture.md`](../architecture.md).
- **Load-bearing rules** → [`invariants.md`](../invariants.md).
- **What shipped, when** → [`CHANGELOG.md`](../../CHANGELOG.md).

---

## {{phase name}} ({{YYYY-MM-DD}})

| Date | Decision | Codified in |
|---|---|---|
| {{YYYY-MM-DD}} | {{one-line decision}} | {{doc §section}} |
