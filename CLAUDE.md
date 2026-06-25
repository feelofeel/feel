---
title: FEEL — Framework Super-Index
id: super-index
role: index
status: living
doc_revision: 1
feel_version: "1.1"
updated: 2026-06-25
source_of: []
derived_from: []
---

# FEEL — Framework Super-Index

**FEEL is a documentation operating system for projects.** Git versions code; FEEL versions docs. Single core value: **any agent or human can navigate a project's docs from one map, cheaply, without reading bodies.** Not a wiki, not a CMS, not a replacement for code comments.

```
Project doc is edited
  ↓ /feel-doc refreshes head + relations
One super-index routes every task (CLAUDE.md or AGENTS.md)
  ↓ agent reads smallest matching doc
Decision made → /feel-decision appends to log
  ↓ /feel-repeat periodically audits staleness + symmetry
```

FEEL owns doc metadata, relations, ceremony levels. Projects own their content, domain rules, and project-specific skills.

---

## Super-index

**The catalog routes; the heads version.** Each doc's YAML head is its identity card.

### Doc catalog

- **Framework spec:** [feel](docs/conventions/feel.md) *(operating spec — §1–10: head format, vocabularies, versioning, relations, index-first, governance, ceremony, skills, scope, quick-ref)*
- **Adoption guide:** [feel-adoption](docs/conventions/feel-adoption.md) *(read once when adopting — layers L1–L4, new-project steps, agent bindings, scale envelope)*
- **History:** [decisions](docs/history/decisions.md) *(log — skill-only)*
- **Templates:** [templates/](templates/) *(CLAUDE.md skeleton, feel.config.yaml, decisions.md, docs-index.md)*
- **Examples:** [FEEL-EXAMPLES/](FEEL-EXAMPLES/README.md) *(FEFO + Landing real adoption patterns)*
- **Foundation:** [foundation/](foundation/README.md) *(FEEL promise, principles, evidence, bench protocol)*

### Change-type router

| Changing… | Read first | Anchor |
|---|---|---|
| FEEL spec (§1–10) | feel.md (the whole file — small) | `docs/conventions/feel.md` |
| Adoption guide / scale | feel-adoption.md | `docs/conventions/feel-adoption.md` |
| Core skills (feel-doc, feel-decision, feel-repeat, feel-session, feel-health) | feel.md §8; skill's own ## Contract | `.claude/commands/feel-*.md` |
| Extended skills (archived) | feel.md §8; skill's own ## Contract | `.claude/skills-archive/feel-*.md` |
| Templates | feel-adoption.md §2 (adoption steps) | `templates/` |
| Config schema (FRAMEWORK SCHEMA) | feel.md §8 (feel-repeat config), feel-adoption.md §2 | `templates/feel.config.yaml` |
| Examples | feel-adoption.md §2 | `FEEL-EXAMPLES/` |
| Foundation / brand | — | `foundation/`, `brand/lore.md` |

---

<!-- FEEL framework rules -->
## Behavioral guidelines

### Absolute rules

- **Portability constraint — non-negotiable.** `feel-*` skills, `feel.md`, and `feel-adoption.md` must never depend on any host project's domain, schema, or workflow. Before changing any of these: ask _does this make sense in a project that has never heard of SORT, baristas, Poster, or Supabase?_ If not, it belongs in a `<project>-*` skill or project doc, not here.
- **Projects are examples, never justifications.** FEFO, Landing, and any other adopter may appear as concrete examples (useful). They must never be the *reason* a FEEL rule exists. Derive rules from cross-project principles, not one project's convenience.
- **`docs/history/decisions.md` is skill-only.** Never hand-edit it — only `/feel-decision` writes it.
- **The spec and skills are version-locked together.** A skill contract must describe behavior consistent with the current `feel_version`. If the spec changes, all affected skills must be updated in the same commit.

### How to work in this repo

1. **Route via the change-type table above.** Open the smallest matching doc.
2. **Portability check before any feel-* change.** Name one project that has never seen this codebase — would the rule still make sense? If yes, proceed. If no, it's a project adaptation.
3. **Choose ceremony by risk.** Spec changes → safety (log decision, update all affected skills). Skill fixes → normal (update contract section). Examples / foundation / README → light.
4. **Log non-obvious framework decisions with `/feel-decision`.** The substance goes in the relevant spec section first.

---

## Project excellency

- **The spec is the source of truth.** Skills reference `feel.md` §sections, not their own copy of the rule. When a rule and a skill diverge, fix the skill.
- **Ceremony is proportional.** A typo fix in README is light; a §1 head-format change is safety-level.
- **The decision log is append-only and skill-only.** `/feel-decision` appends; rows are pruned once absorbed.
- **Examples stay thin.** `FEEL-EXAMPLES/` shows adoption *patterns*, not full project docs. No content that would confuse "this is FEEL" with "this is FEFO."

**Skill family.** Core (active): `feel-doc`, `feel-decision`, `feel-repeat`, `feel-session`, `feel-health`. Extended (archive, activate on demand): `feel-ghost`, `feel-trace`, `feel-shrink`, `feel-contract`, `feel-mistake`, `feel-sibling`, `feel-seed`, `feel-summary`, `feel-diff`. Project-specific skills belong in the project repo, not here.
<!-- /FEEL framework rules -->

---

## Sticky facts

- **feel_version:** `1.1`
- **Repo:** `https://github.com/feelofeel/feel`
- **npm (Phase 2):** `@feelofeel/feel` (not yet published; v0.1.0 is the pre-publish baseline)
- **Active adopters:** [FEFO](https://github.com/feelofeel/fefo) (L3+L4) · [SORT Landing](https://github.com/feelofeel/SORT-Landing) (L3)
- **Phase 2 gate:** FEFO + Landing stable on decoupled FEEL for 3+ weeks → publish `@feelofeel/feel@1.0.0`
