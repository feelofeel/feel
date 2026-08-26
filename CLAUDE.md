---
title: FEEL — Framework Super-Index
id: super-index
role: index
status: living
doc_revision: 4
feel_version: "1.6"
updated: 2026-08-14
source_of: []
derived_from: []
---

# FEEL — Framework Super-Index

**FEEL is a documentation operating system for projects.** Version control is preferred but optional; FEEL versions docs before git, after git, and across tools. Single core value: **any agent or human can navigate a project's docs from one map, cheaply, without reading bodies.**

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

**The catalog routes; the heads version.** Each doc's variable-length YAML head is its identity card. Read through the closing `---`; use optional audience, Diátaxis, relation, and `toc` fields before opening a body.

### Doc catalog

- **Framework spec:** [feel](docs/conventions/feel.md) *(operating spec — head format, optional Diátaxis/publication metadata, vocabularies, versioning, relations, index-first reading, governance, ceremony, skills, scope)*
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
| Installer / deterministic helpers | feel-adoption.md §2, §5; consuming skill contract | `tools/install.mjs`, `tools/feel/` |
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

1. **Route via the change-type table above.** Open the smallest matching doc (or use `node tools/feel/route-diff.mjs`).
2. **Portability check before any feel-* change.** Name one project that has never seen this codebase — would the rule still make sense? If yes, proceed. If no, it's a project adaptation.
3. **Choose ceremony by risk.** Spec changes → safety (log decision, update all affected skills). Skill fixes → normal (update contract section). Examples / foundation / README → light.
4. **Log non-obvious framework decisions with `/feel-decision`.** The substance goes in the relevant spec section first.

---

## Project excellency

- **The spec is the source of truth.** Skills reference `feel.md` §sections, not their own copy of the rule. When a rule and a skill diverge, fix the skill.
- **Ceremony is proportional.** A typo fix in README is light; a §1 head-format change is safety-level.
- **The decision log is skill-only.** Append works everywhere; prune only when durable history preserves absorbed rows.
- **Examples stay thin.** `FEEL-EXAMPLES/` shows adoption *patterns*, not full project docs. No content that would confuse "this is FEEL" with "this is FEFO."

**Skill family.** Core (active): `feel-doc`, `feel-decision`, `feel-repeat`, `feel-session`, `feel-health`. Extended (archive, activate on demand): `feel-ghost`, `feel-trace`, `feel-shrink`, `feel-contract`, `feel-mistake`, `feel-sibling`, `feel-seed`, `feel-summary`, `feel-diff`. Project-specific skills belong in the project repo, not here.
<!-- /FEEL framework rules -->

---

## Sticky facts

- **feel_version:** `1.6`
- **Repo:** `https://github.com/feelofeel/feel`
- **npm (Phase 2):** `@feelofeel/feel` (not yet published; v0.2.0 is the capability-aware pre-publish baseline)
- **Active adopters:** [FEFO](https://github.com/feelofeel/fefo) (L3+L4) · [SORT Landing](https://github.com/feelofeel/SORT-Landing) (L3)
- **Phase 2 gate:** FEFO + Landing stable on decoupled FEEL for 3+ weeks → publish `@feelofeel/feel@1.0.0`
