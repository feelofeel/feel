---
title: {{PROJECT}} — Engineering Brief & Super-Index
id: super-index
role: index
status: living
doc_revision: 1
updated: {{YYYY-MM-DD}}
source_of: []
derived_from: []
---

# {{PROJECT}} — Engineering Brief & Super-Index

**{{PROJECT}} is {{one line: what it is and what it sits on top of}}.** {{The single core value, in one sentence — the one thing that must always be true for a user.}} Docs run on **[FEEL](docs/conventions/feel.md)** — this file is the super-index.

<!-- Optional: a one-screen ASCII flow of the system's main loop. -->

---

## Super-index

This is the map. **The catalog routes; each doc's head versions.** For freshness, lineage, audience, or reader need, read YAML from the opening `---` through its closing `---`; if `head_lines` exists, continue through that declared navigation zone. Never assume a fixed line count. To route a task, scan the change-type table below.

### Doc catalog

<!-- Group by role. One line per doc; note key relations inline (e.g. spec → guides). -->
- **Rationale & rules:** [architecture](docs/architecture.md) · [invariants](docs/invariants.md)
- **Product specs:** [app-user-stories](docs/product/app-user-stories.md) *(→ guides)* · …
- **Guides (derived):** …
- **References:** [glossary](docs/glossary.md) · …
- **Conventions:** [feel](docs/conventions/feel.md) *(how docs work)* · …
- **Planning & history:** [roadmap](docs/roadmap.md) · [decisions](docs/history/decisions.md) *(log — skill-only)*
- **Indexes:** [index](docs/index.md) *(public entry)* · this file *(super-index)*

### Change-type router

Changing something? Read the smallest matching row, then its code anchor. Tests live beside each anchor.

| Changing… | Read first | Code anchor |
|---|---|---|
| {{change type}} | {{docs to read}} | {{code path}} |

---

<!-- FEEL framework rules -->
## Behavioral guidelines

### Absolute rules

- {{Hard guardrail the agent must never violate.}}

### How to work in this codebase

1. {{Workflow step — e.g. "before any X, do Y".}}
2. **Choose ceremony by risk.** Safety work gets full guardrails; normal behaviour/doc work gets sync; light copy/CSS/internal refactors avoid churn; explicit skip-ceremony still respects safety rules.

---

## Project excellency

What "good" looks like here. Enforced by skills where risk earns it, and kept light everywhere else.

- **Tests are executable truth, not coverage theatre.** {{testing discipline — framework, style, what one test covers}}
- **Ceremony is proportional.** Safety work gets full ceremony; normal feature work keeps specs/docs/changelog honest; light polish avoids process churn. Explicit skip-ceremony never bypasses safety rules.
- **Docs self-describe and route cheaply (FEEL).** Every doc opens with a YAML head (`docs/conventions/feel.md`); relations are declared both ways; this super-index is the one map. Don't add a doc without a head.
- **The decision log is skill-only.** `/feel-decision` appends everywhere; it prunes absorbed rows only when durable history preserves them. Without history, keep it append-only.
- {{Other project disciplines — migrations, integrations, etc.}}

**Skill family.** `feel-*` are framework-generic: `feel-doc`, `feel-decision`, `feel-repeat`, `feel-session`, `feel-health`. `{{project}}-*` are project-specific.
<!-- /FEEL framework rules -->

---

## Sticky facts

- {{URLs, IDs, accounts, env var names, next migration number — the constants worth always having loaded.}}
