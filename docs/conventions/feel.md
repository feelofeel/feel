---
title: FEEL — Documentation Operating System
id: feel
role: convention
status: canonical
doc_revision: 13
feel_version: "1.5"
updated: 2026-08-03
source_of: [feel-adoption]
derived_from: []
toc:
  - "§1 The frontmatter head"
  - "§2 Vocabularies"
  - "§3 Versioning"
  - "§4 Relations"
  - "§5 Index-first reading"
  - "§6 Governance"
  - "§7 Ceremony levels"
  - "§8 The skill family"
  - "§9 Scope — what FEEL heads are for"
  - "§10 Quick-reference card"
---

# FEEL — a documentation operating system

**FEEL** is how docs work in a project. Version control strengthens evidence when available; **FEEL versions docs with or without it**. The goal is to *feel light*: quick lookups, few tokens, no soreness from re-reading thousands of lines to find one fact.

It rests on four pillars:

- **F — Frontmatter first.** Every doc opens with a YAML head that declares its identity, role, version, and relations. Read the complete block through its closing `---`; heads are variable-length identity cards, not a fixed number of lines.
- **E — Explicit, two-way relations.** Authoring relations (`source_of` / `derived_from`) are declared on **both** ends. The doc graph lives in data — checkable by a skill, viewable in Obsidian.
- **E — Evolve with proportional ceremony.** Docs carry `doc_revision` + `app_version` + `updated`, but the process scales with risk: safety work gets full ceremony; light polish does not.
- **L — Light by default.** One super-index (`CLAUDE.md`) routes every task. The **catalog routes; the heads version.** Read the smallest bucket that answers the question.

This file is the operating spec — what you run every session. **Adopting FEEL in a new project, choosing how deep to go, agent bindings, and scaling past the tested envelope live in the companion [feel-adoption](feel-adoption.md).** The seed of the boilerplate: copy both files + the `feel-*` skills + a `CLAUDE.md` skeleton into a new repo and you have FEEL.

---

## 1. The frontmatter head

Every Markdown doc under `docs/` (and `CLAUDE.md`) starts with a YAML head:

```yaml
---
title: Feature Specs & Acceptance Criteria  # human title (may differ from the H1)
id: feature-specs                           # kebab-case, unique, stable — the machine handle
role: spec                                  # see §2
status: canonical                           # see §2
doc_revision: 7                              # integer, bumped on each meaningful content change
app_version: 1.47.0
updated: 2026-05-30                         # YYYY-MM-DD of last meaningful content change
validated_prod_version: 1.10.0              # optional: prod app version observed during validation
validated_dev_version: 1.10.0               # optional: dev app version observed during validation
validated_at: 2026-05-30                    # optional: date of prod/dev validation
source_of: [user-guide, admin-guide]        # docs authored FROM this one (ids)
derived_from: []                            # docs this one is authored FROM (ids)
---
```

`id` is the stable machine handle. It answers "which doc is this?" Filenames can move (a doc relocating to `conventions/` keeps its `id`); links and relations reference the `id`, so nothing downstream breaks on a move.

**A derived doc** (one authored from another) carries the same fields but inherits `app_version` from its source and declares the back-link: `derived_from: [feature-specs]`, `source_of: []`.

Optional fields, used only when they earn their place:

- `related: [ids]` — non-authoring cross-links worth surfacing in the graph.
- `supersedes` / `superseded_by: <id>` — for replaced docs.
- `tracker: <external-id-or-url>` — convenience back-link to the external work-tracker item driving this doc's changes. **Not** part of the authoring graph: no symmetry, `feel-doc` doesn't validate it, remove it when the work closes. Which tracker a project uses is declared in `feel.config.yaml`, never in this spec.
- `validated_prod_version` / `validated_dev_version` / `validated_at` — evidence a visually or operationally sensitive doc was checked against live environments. For UI, runbook, and environment docs; omit for ordinary conceptual edits.
- `audience: <id> | [ids]` — intended reader types from the project taxonomy. It helps a router choose among adjacent docs; it does not create an authoring relation.
- `toc: ["§1 Title", …]` — H2-level section index, for docs with 4+ sections. Lets a reader grasp structure from the head alone and issue a targeted section read instead of loading the body. Maintained by `feel-doc`.
- `head_lines: <int>` — line count of the complete navigational zone when a post-YAML summary follows the head. Readers always consume YAML through the closing delimiter first, then continue to this line only when the field exists. Omit it for ordinary heads.

### Reader need and publication metadata

[Diátaxis](https://diataxis.fr/) is an optional second dimension for durable practitioner-facing articles. FEEL still owns authority, freshness, lineage, and routing; Diátaxis says what the reader needs at this moment:

[Complex hierarchies are supported](https://diataxis.fr/complex-hierarchies/): FEEL keeps audience-first catalogs and landing routers instead of forcing four top-level folders.

| Content | Serves | `diataxis` |
|---|---|---|
| action | acquisition of skill | `tutorial` |
| action | application of skill | `how-to` |
| cognition | application of skill | `reference` |
| cognition | acquisition of skill | `explanation` |

- `diataxis: tutorial | how-to | reference | explanation` — optional on an internal practitioner article when it adds useful information beyond `role`; normally omitted from specs, indexes, logs, plans, and research.
- `page_kind: article | landing` — delivery shape used by a configured publication contract. An article answers one primary reader need. A landing routes to several and therefore omits `diataxis`.
- `visibility`, `locale`, `translation_key`, `translation_revision`, `slug`, `summary`, and `publish_target` are optional delivery metadata. A project's `publications` config declares which are required; FEEL does not assume a publisher or locale.

`role` and `diataxis` are deliberately orthogonal: a FEEL `guide` can be a tutorial or how-to, while a `rationale` can publish as explanation. If an article cannot honestly choose one primary mode, split it or turn it into a landing that routes to focused articles. Internal `role: index` pages already provide this routing shape and do not need `page_kind` merely for symmetry.

---

## 2. Vocabularies

**`role`** — what kind of doc this is. Drives where it sits in the catalog and how heavily it's read.

| role | meaning | examples |
|---|---|---|
| `index` | navigational catalog or router | `index`, `feature-router` |
| `spec` | canonical product / feature specification | `feature-specs`, `developer-stories` |
| `reference` | stable factual reference | `invariants`, `glossary`, `api-reference` |
| `convention` | design / style / process choice | `feel`, `ui-design` |
| `guide` | derived how-to for an end user or operator | `user-guide`, `admin-guide`, `local-dev-setup` |
| `rationale` | design rationale / architecture | `architecture` |
| `log` | append-only historical record | `decisions` |
| `plan` | forward-looking plan; may be superseded by reality | `roadmap` |

**`status`** — the doc's lifecycle state.

| status | meaning |
|---|---|
| `living` | continuously updated to track reality |
| `canonical` | the authoritative source for its domain |
| `draft` | incomplete content, not yet ready to rely on |
| `working` | active analysis or research that may change as evidence develops |
| `plan` | a plan not yet (fully) realized |
| `deprecated` | superseded; kept for history (set `superseded_by`) |

---

## 3. Versioning

Two stamps are required everywhere; a third binds docs to a **version stream** when the repo has one:

- **`doc_revision`** — *what local revision of this doc is this?* An integer, starting at `1`, bumped by `feel-doc` on each substantive edit. It is only an ordering counter inside the doc's own history, not a product reference and not an identity. Cosmetic touches (typos, adding the head) do **not** bump it.
- **`updated`** — *when was it last true?* The date of the last meaningful content change.
- **`app_version`** — *what was the product when this doc was last made true?* The `CHANGELOG.md` app semver current at `updated`. This is the product anchor: it ties a doc to app reality, so you can see at a glance whether a doc predates a feature.

**Version streams.** `app_version` is one binding of a general idea: a doc anchored to the release stream of the thing it describes. Use the binding that matches the repo:

| Repo shape | Stream field | Anchor |
|---|---|---|
| Shipping app (this repo) | `app_version` | `CHANGELOG.md` semver |
| Library / package | `lib_version` | package manifest version |
| Monorepo | one stream field per package; a doc carries the stream of the package it describes | each package's manifest |
| Docs-only / no release train | **omit the stream field** | `doc_revision` + `updated` carry versioning alone |

A repo without a release train is a first-class FEEL citizen, not an exception — the stream field is required only where a stream exists (L4, see [feel-adoption](feel-adoption.md) §1). Docs describing FEEL itself carry `feel_version` instead (the version of this spec they conform to).

Optional validation stamps answer a narrower question: *which deployed app versions were observed when this doc was checked?* Use them when the doc's truth depends on seeing prod/dev reality (UX conventions, environment maps, runbooks). Do not encode prod/dev versions in `doc_revision`; one doc edit can be conceptual, pre-release, post-release, or inherited.

**Inheritance.** A derived doc (`derived_from` set) inherits its source's `app_version` — the guides move when the spec moves, not on their own clock. Group docs that share a parent can share a version this way.

---

## 4. Relations

`source_of` / `derived_from` capture the **authoring** relation: *"this doc is written FROM that one."* The guides are written from the feature spec; therefore:

- `feature-specs` → `source_of: [user-guide, admin-guide]`
- `user-guide` → `derived_from: [feature-specs]`
- `admin-guide` → `derived_from: [feature-specs]`

**Symmetry is law.** Every `source_of: [X]` MUST have a matching `derived_from` entry in `X`, and vice-versa. A dangling relation is a bug; `feel-doc` checks symmetry on every run.

**Links vs relations.** Two layers, on purpose:

- **Body links** use GitHub-flavored Markdown — `[the guide](../guides/user-guide.md)` — so the public repo renders correctly.
- **Relations** in frontmatter use `id`s — the machine-readable, move-proof layer that tools and Obsidian resolve.

**Obsidian is an optional lens.** Because relations are frontmatter `id`s, you can open `docs/` as an Obsidian vault for graph view and backlinks at any time. Nothing *depends* on Obsidian — don't put `[[wikilinks]]` in bodies (they don't render on GitHub).

---

## 5. Index-first reading (the light contract)

**The catalog routes; the heads version.**

- **`CLAUDE.md` is the super-index** — always loaded, the one map. It holds a compact **doc catalog** (`id · role · read-when · relations`) and the **change-type router** (changing X? → read these docs / code / tests). One glance routes any task; you should rarely need to open another doc just to find where to look.
- **The heads carry the versions.** When you need freshness or lineage, read from the opening `---` through the closing `---`. If the head declares `head_lines`, continue through that navigation zone. Never assume a fixed line count.
- **`docs/index.md`** is the public entry point for GitHub browsers: the public/local tier split plus a plain link list. It points at the `CLAUDE.md` super-index for routing rather than duplicating it.

Reading order for any change: `CLAUDE.md` (rules + router) → the bucket's docs → the code anchor → the concept test. Read the smallest bucket that matches; widen only if the task crosses a boundary.

The full traversal, as a contract:

```
CLAUDE.md (always loaded)
  └─ change-type router → which doc + code anchor
       └─ complete doc head → current? · role/audience/reader need? · relations/toc?
            ├─ [derived_from set?] check source's app_version; if source is newer, read source first
            ├─ [source_of set?]   derived docs inherit app_version; feel-doc syncs them downstream
            └─ doc body → only if head confirms this is the right place
                 └─ code anchor → implementation
                      └─ concept test → executable truth
```

**Traversal rules:**
- Source is authority — on conflict, update source first; `feel-doc` syncs derived docs. Read a source/derived pair as source head → relevant source section → derived head, opening the derived body only for role-specific content the source lacks.
- Body links ≠ authoring relations — `[see architecture §4]` is navigation; only `source_of`/`derived_from` is the graph.
- **Staleness rule (standing):** before acting on a doc, inspect its stream stamp when one exists; otherwise use `updated`, `doc_revision`, and source relations. Update body + `/feel-doc` before relying on evidence that predates the change.

---

## 6. Governance — the decision log is skill-only

`docs/history/decisions.md` is an append-only `log`. It is written **only** by the `feel-decision` skill — never by hand. Two operations:

- **append** — when a non-obvious decision is made, add one dated row: `| date | decision | codified in |`. The substance goes in the named governing doc. If absorbing it immediately would be disproportionate, mark the target `(pending)` and absorb it at the next audit; a pending row is never a prune candidate.
- **prune-audit** — verify each row's *codified in* target actually contains the decision. Delete an absorbed row only when durable history already preserves it and the human approves. With no tracked history or declared immutable archive, report candidates but keep the log append-only.

A decision graduates once it is incorporated elsewhere and durable history preserves the removed row. Git is the preferred archive, not a prerequisite for append mode. Projects without durable history keep the live log append-only. A `(pending)` marker is removed only after its substance lands.

**Division of labour.** The human owns intent, scope, approval of risky actions, and prune-audit judgment (only rows the human explicitly confirms get pruned — absorption is validated by a human read, not a file-existence check). The AI owns routing, execution, skill invocation per ceremony level, and doc-head maintenance — the human never manually bumps `doc_revision`/`app_version` or hunts for the authoritative file.

### Authoring with AI assistance

Three rules whenever a human edits a FEEL-managed doc directly (editor, chat UI, or paste):

1. **Match the doc type before writing.** Every CLAUDE.md section should answer: *invariant (must be true every session) or tactic (how to execute one kind of task)?* Invariants — hard rules, guardrails, always-true workflow steps — belong in the super-index. Tactics — execution style, "this time do X", plan-mode behaviour — belong in a decision-log entry, a guide, or said in-session. A tactic in CLAUDE.md adds permanent token cost with session-bounded value.

2. **Manual edits need `/feel-doc` to close.** Edit freely; the skill is the hygiene step, not the authoring step. After any free-form addition, run `/feel-doc` to resync `doc_revision`, `updated`, and relations. A doc edited without closing the loop has a stale head and may lose relation symmetry.

3. **Project adaptations live in CLAUDE.md fences, not in the spec.** Changes to `feel.md` propagate to every future FEEL adoption (`feel_version` tracks which spec revision a copy derives from). Project-specific rules — custom ceremony levels, domain guardrails, skill triggers — belong in `CLAUDE.md` behind `<!-- project rules -->` fences or `feel.config.yaml` PROJECT DATA. To evolve the spec itself, do it intentionally: bump `feel_version` and treat it as a FEEL release.

---

## 7. Ceremony levels

FEEL is not a tax. Pick the smallest ceremony that protects the risk:

| Level | Use for | Required behaviour |
|---|---|---|
| **Safety** | External writes, destructive changes, migrations, production operations, auth, tenancy | Full guardrails: read governing docs, use any named project skill, update load-bearing docs, record non-obvious decisions, and verify before impact. |
| **Normal** | Feature behaviour, user-visible flows, docs, operator workflow | Sync relevant specs/docs, update the project changelog when a release stream uses one, and run focused checks. |
| **Light** | Copy, CSS, visual polish, internal refactors | Inspect nearby context, test only what risk justifies, and skip changelog/version/doc-head churn unless behaviour changed. |
| **Emergency / skip** | Explicit owner request: "skip ceremony", "no ceremony", "skip the skills", "quick one" | Do the work with no routine changelog/doc overhead. Safety ceremony still applies if safety areas are touched; log only safety-relevant actions. |

If a task mixes levels, follow the highest-risk level for the risky part and keep the rest light. The decision log is for choices that constrain future work, not for every implementation detail.

**Version bookkeeping is release-cut only when a release stream exists.** In-flight work updates only changed docs and any project-defined Unreleased record. Projects without a release train omit stream fields and use `doc_revision` + `updated`.

---

## 8. The skill family

FEEL ships as skills (`.claude/commands/`). The naming line is the reusability boundary:

- **`feel-*` — framework-generic, portable to any project.** The active core is five skills:
  - `feel-doc` — create or update a doc to the FEEL standard: refresh revision/date, optional stream and reader/delivery metadata, relation symmetry, and the canonical super-index.
  - `feel-decision` — the sole writer of `decisions.md`; append works everywhere, while pruning requires durable history (§6).
  - `feel-repeat` — doc **and skill** network health check: detects malformed or inconsistent heads, cross-doc staleness, missing relations, mixed reader modes, repetition, size drift, and skill-layer drift. Run after any doc edit (`--diff`) or periodically as a full-graph scan.
  - `feel-session` — capability-aware session brief: prefer git/history, then degrade to filesystem state and optional local planning/release pointers in ≤20 lines.
  - `feel-health` — the **success gauge**: doc/skill token-footprint and head-cost dashboard over `tools/feel/health.mjs`. With `feel-repeat` it answers "is FEEL set up right and still light?" — `feel-repeat` audits structural honesty; `feel-health` audits weight and deterministic head validity.
- **`<project>-*` — project-specific, stay with the project:** e.g. `<project>-changelog`, `<project>-migration` (versioning, schema changes, API integration).

**The extended set is archived, not deleted.** Optional `feel-*` skills live in `.claude/skills-archive/` — copy one into `.claude/commands/` to activate it. Each adds context cost, so activate only what a project earns.

**Contracts.** Skills carrying a `## Contract` section (`requires / guarantees / never`) are chainable and auditable — the `never` clauses constrain an AI that might otherwise hallucinate an action. New skills should always include one. Skill shape: YAML `description` (triggers) → a first visible line stating what the skill does → numbered steps → `## Argument`. The first line matters in the Claude Code UI.

**The skill family is subject to the same honesty audits as docs.** Skills accrete and drift exactly like documentation — stale duplicates linger after a rename, references dangle when a skill is archived, contracts go missing, and a portable `feel-*` skill picks up a host-project term. `feel-repeat` therefore scans the skill directories (active + archived) alongside the doc graph; a clean skill layer is part of "FEEL is set up right," not a separate concern.

---

## 9. Scope — what FEEL heads are *for*

FEEL heads solve one specific problem: **the described thing can drift from the describing thing.** A doc describes a feature; the feature changes; the doc doesn't know. `app_version` bridges that gap. `source_of`/`derived_from` make the authoring graph explicit because it isn't structurally enforced anywhere else.

This condition is **absent for code files:**

- A code file IS the current state — it cannot be stale relative to itself.
- The import graph already IS the relationship graph, runtime-enforced (a comment that can drift vs. a module system that fails loudly).
- Version control, when present, provides authorship, date, and line-level diff. Without it, FEEL heads still expose doc identity, local revision, date, and relations; agents must label the weaker evidence.

**The heuristic:** apply FEEL heads wherever described and describer can drift independently. Don't apply them where structural enforcement already guarantees consistency.

For code→doc traceability, prefer a central router (CLAUDE.md's change-type table) over per-file concept tags. One router update reaches every file in a module; distributed headers contradict each other silently and give no reverse direction.

---

## 10. Quick-reference card

```
Starting a change?           → canonical super-index router first
Reading any doc?             → consume YAML through closing ---; then honor head_lines
Reading a derived doc?       → compare source stream/date/revision before its body
Classifying an article?      → action/cognition × acquisition/application (§1)
Choose ceremony level        → safety / normal / light / emergency-skip (§7)
Editing a source doc?        → /feel-doc for meaningful action-changing edits
Doc looks stale?             → update body + /feel-doc before relying on it
Version control available?   → prefer status/history/diff as strongest evidence
No version control?          → use filesystem/session evidence; label uncertainty
Non-obvious decision?        → /feel-decision (append works without git)
Pruning decisions?           → require tracked history or immutable archive
Release stream exists?       → use its project-specific changelog/release routine
```

If Claude misses a skill, tune the trigger phrases in that skill's `description:` frontmatter — the cheapest fix before reaching for settings.json hooks.
