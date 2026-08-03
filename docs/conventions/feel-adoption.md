---
title: FEEL — Adoption, Layers & Scale
id: feel-adoption
role: convention
status: canonical
doc_revision: 3
feel_version: "1.5"
updated: 2026-08-03
source_of: []
derived_from: [feel]
toc:
  - "§1 Layers — adopt in stages"
  - "§2 Adopting FEEL in a new project"
  - "§3 Agent bindings"
  - "§4 Scale envelope"
---

# FEEL — Adoption, Layers & Scale

How to **bring FEEL into a project, decide how deep to go, bind it to your agent, and stretch it as the project grows.** This is the companion to [feel](feel.md) (the operating spec): feel.md is what you run every session; this is what you read once when adopting FEEL or when the project outgrows its tested envelope.

---

## 1. Layers — adopt in stages

FEEL is four layers, not one religion. Each layer is independently useful, names what it costs, and requires only the layers below it. **Stopping at any layer is a valid adoption, not a partial one.**

| Layer | What it is | What you get | What it costs |
|---|---|---|---|
| **L1 — Heads** | YAML frontmatter ([feel](feel.md) §1–2) + two-way relations ([feel](feel.md) §4) on every doc | Docs self-describe; staleness and lineage visible from the complete head; graph checkable | A head per doc; symmetry upkeep on relation changes |
| **L2 — Index** | The super-index file ([feel](feel.md) §5): catalog + change-type router | Any task routes from one map; agents stop exploratory reading | Keeping the catalog and router current as docs/anchors move |
| **L3 — Ceremony** | Proportional process ([feel](feel.md) §7), decision log ([feel](feel.md) §6), the core skills ([feel](feel.md) §8) | Docs stay true with or without version control; git/history enriches evidence when present | A few skill runs per working session; pruning stays disabled until durable history exists |
| **L4 — Release machinery** | Version streams ([feel](feel.md) §3), release-cut sweeps, changelog discipline, project-specific concurrency protocol | Docs anchored to shipped reality; "does this doc predate the feature?" answerable at a glance | A release train and durable version history |

Typical mappings: a docs-only or library repo stops at L2; a maintained product takes L3; a shipping app with releases takes L4. The layers also name the sales boundary: L1–L2 are the portable artifact anyone can fork; L3–L4 are the practice.

---

## 2. Adopting FEEL in a new project

Adoption is **layered** — decide how deep to go with §1 (Layers) first; every step below past step 1 is optional at the shallower layers.

The full seed:

1. Copy [feel](feel.md) to `docs/conventions/feel.md` and this file to `docs/conventions/feel-adoption.md`. Keep their `feel_version` — that records which FEEL spec your copy derives from, so when FEEL itself moves you can see the drift. Project-coupled adaptations of the spec belong in your project docs, not edits to the copy; if you fork the spec anyway, keep the original `feel_version` so the divergence point stays visible.
2. Copy the `feel-*` skills into `.claude/commands/`. At minimum: `feel-doc` and `feel-decision`; the recommended core adds `feel-repeat`, `feel-session`, and `feel-health` ([feel](feel.md) §8). Optional skills live in `.claude/skills-archive/`.
3. Copy `tools/feel/health.mjs`; it provides deterministic size and role-budget checks for `feel-health` and `feel-repeat`.
4. Copy `feel.config.yaml` and replace the **PROJECT DATA** sections (audiences, docs, relations, comparison_groups) with your project's equivalents. Keep the **FRAMEWORK SCHEMA** sections (ceremony_levels, head_count, routine shape) as-is.
5. Start `CLAUDE.md` from the skeleton: **Identity · SUPER-INDEX (catalog + router) · Behavioral guidelines · Project excellency · Sticky facts**. Use `<!-- FEEL framework rules -->` / `<!-- project rules -->` fences to mark which sections are portable.
6. Create `docs/index.md` (public pointer) and `docs/history/decisions.md` (empty skill-only log). Pin the adopted version in `.feel/feel.lock`.
7. Give every doc a FEEL head from day one. Read and validate heads through their closing delimiter; never standardize them to a fixed line count.
8. If the project has durable practitioner-facing articles, decide whether Diátaxis adds a useful reader-need dimension. Keep it selective: require a mode for published articles, let landings route several modes, and omit it where `role` already answers the routing question.
9. Create your own `<project>-*` skills for project-specific workflows (changelog, migrations, API integration scripts). Don't put project-specific logic in `feel-*` skills.

That's the whole framework: heads that self-describe, one index that routes, a log that prunes itself, skills that keep it honest, and a config file with clear framework/project layering.

**Portability constraint.** FEEL is framework-generic — its design decisions, skill contracts, and naming conventions must not depend on any host project's domain, schema, or workflow. The host project may appear as a concrete example (allowed, useful), but never as the reason a FEEL rule exists. When designing a new `feel-*` skill or changing the convention, ask: _does this make sense in a project that has never heard of this codebase's domain?_ If not, it belongs in `<project>-*` or the project's own docs, not here.

**Config layering.** `feel.config.yaml` has two clearly marked layers: **FRAMEWORK SCHEMA** (ceremony levels, head_count thresholds, routine shape — portable) and **PROJECT DATA** (audiences, docs, relations, comparison groups — project-specific). When adopting FEEL, keep the framework sections and replace the project sections.

---

## 3. Agent bindings

The heads/index/relations core (L1–L2) is plain Markdown and YAML — **agent-agnostic by construction**. Only two things bind to a specific tool, and both have cheap equivalents:

- **The super-index file.** `CLAUDE.md` is the Claude Code binding. The cross-agent convention is `AGENTS.md` (read by Codex, Cursor, Copilot, and others). Pick **one canonical file** for the content and make the other a one-line pointer at it — never maintain two divergent copies (that breaks "one map", [feel](feel.md) §5). Claude-first repos (like this one) keep `CLAUDE.md` canonical with `AGENTS.md` pointing in; agent-mixed or public repos should author `AGENTS.md` as canonical and point `CLAUDE.md` at it.
- **Skills.** `.claude/commands/` is Claude Code's slash-command binding. A skill file is just a Markdown prompt with a contract — in any other agent it degrades gracefully to a **runbook**: reference it from the index, paste it, or wire it into that agent's equivalent (Cursor rules, Copilot prompt files). The `## Contract` section is what makes a skill auditable anywhere; the slash command is convenience, not substance.

Everything else — heads, relations, the router table, the decision log, ceremony levels — is tool-free text. An agent that can read files can run FEEL.

**Variable-length heads.** Agent bindings must read YAML until the second `---`, not request a folklore-sized prefix. After that, `audience`, `diataxis`, relations, and `toc` decide whether the body is relevant and which section to open. `head_lines` is only an explicit extension for a post-YAML navigation summary.

### Capabilities, not prerequisites

FEEL detects what a project has instead of demanding infrastructure up front:

- **Git with history:** primary evidence for last change, diffs, authorship, and safe decision-log pruning.
- **Git without commits:** use working-tree status; report that history does not exist yet.
- **No git:** use current-session paths, filesystem state, doc revisions, dates, and relations; label the evidence as weaker. Append decisions normally, but never prune them.
- **No changelog or roadmap:** omit those signals and use any configured manifest, tracker, plan doc, or status doc. A missing optional signal never blocks a core skill.

---

## 4. Scale envelope

Honesty about what's tested versus designed:

**Tested envelope (the host project): ~25 docs, one operator, one agent.** Inside it, one super-index routes everything and head upkeep is background noise. Beyond it, the following is **design guidance, not proven practice** — it says how FEEL is built to stretch, pending evidence:

- **Many docs (~50+).** Split the catalog by domain: the root index keeps the change-type router and a short catalog *of sub-indexes*; each domain gets its own `index`-role doc. "One map" means **one root**, not one flat list — depth is allowed, divergence is not. Keep any single router table under ~15 rows; past that, rows stop being scannable and the router needs a domain split.
- **Multiple operators.** The conflict surfaces are known and mostly mechanical: `doc_revision` collisions resolve as *take max + 1* (it's an ordering counter, not meaning); `updated` takes the later date; relation edits conflict like any code merge. Two rules prevent the painful cases: **version-stream sweeps are single-owner** (one person cuts the release; nobody else bumps stream fields mid-flight — already the law in [feel](feel.md) §7), and **the decision log stays skill-only**, which serializes its writes.
- **Multiple agents / mixed tools.** Covered by §3 (Agent bindings) — bindings differ, the text layer is shared.

When a project crosses the envelope, treat the first month as an experiment and feed what breaks back into this section.
