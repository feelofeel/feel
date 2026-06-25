# FEEL Example: SORT Landing

**Repo:** `github.com/feelofeel/SORT-Landing` (public)  
**Layer:** L3 (heads + index + ceremony + core skills; no release train yet)  
**feel_version:** 1.1  
**Docs:** 4 docs (lean; spec-heavy project)  
**Adopted:** 2026-06-16

---

## What makes this adoption distinctive

### 1. Minimal, correct L3 adoption

Landing adopted FEEL from scratch (it was never embedded the way FEFO was). It has exactly what L3 requires and nothing more:

- 4 docs with FEEL heads: `super-index`, `landing-page-definition`, `feel`, `decisions`
- 5 core skills active
- `feel.config.yaml` with 2 audiences, 5 doc registry entries, 2 work modes
- Decision log with 4 inception rows (2026-06-16)

Pattern: **stop at the layer that fits.** Landing is a static Astro site — no migrations, no release train, no DB writes. L3 is sufficient. Deferred L4 isn't missing; it's deliberately not added yet.

### 2. AGENTS.md as a multi-agent bridge

Landing has both `CLAUDE.md` (canonical super-index) and `AGENTS.md` (multi-agent pointer). The AGENTS.md is 6 lines:

```markdown
[YAML head]

# Agent entry point

`CLAUDE.md` is the canonical super-index for this repository.

Agents that load `AGENTS.md` must immediately read and follow `CLAUDE.md`.
If this file and `CLAUDE.md` ever conflict, `CLAUDE.md` wins.
Drift is expected because `CLAUDE.md` is the always-current super-index;
do not duplicate project rules here.
```

This is the **AGENTS.md bridge pattern** from `feel-adoption.md` §3: one canonical file, the other a one-line pointer. Claude-first repos keep `CLAUDE.md` canonical; `AGENTS.md` is the cross-agent convention (read by Codex, Cursor, Copilot, etc.).

When to use: if your project will be worked on by multiple agent types, add an `AGENTS.md` pointing to `CLAUDE.md`. No rule duplication, no divergence.

### 3. No project-specific skills (yet)

Landing has no `landing-*` skills. The CLAUDE.md explicitly notes: *"No `sort-*` project skills yet — add them as project-specific workflows emerge (e.g. `sort-release` when a release train exists)."*

Pattern: **don't pre-build skills.** Project skills emerge from real ceremony needs. Landing will add `landing-release` when it needs a release train (milestone: when SCRUM-69 domain is live and version tracking matters). Starting without them is correct, not incomplete.

### 4. One heavyweight doc, marked exempt

`landing-page-definition.md` is the comprehensive page spec (copy, layout, SEO, analytics, lead form, i18n) — a deliberate large doc. It's marked `head_count_exempt: true` in `feel.config.yaml` so `feel-repeat` reports overflows as a note, not a warning.

Pattern: **use `head_count_exempt` for docs that are intentionally comprehensive** — a reference that is the canonical list of all X, or a spec designed to be read in full. Reserve the warning for docs that grew accidentally large.

### 5. Static build, no migrations

Landing has no DB migrations or API server. Its `feel.config.yaml` omits the `migrations` and `tenancy` items from `ceremony_levels.safety.includes`. This is correct — safety ceremony is project-specific. The FRAMEWORK SCHEMA provides a starting set; projects adapt it.

The one safety concern Landing does flag: **Supabase key management** (the `public.leads` table lives in the FEFO App Supabase project, not Landing's own). This appears in sticky facts, not ceremony_levels — it's a configuration concern, not a code-change ceremony.

---

## CLAUDE.md shape

Landing's super-index has five sections (smaller than FEFO's):

1. **Identity paragraph** — project type (Astro static site), one core value
2. **Super-index** — 4-doc catalog + 5-row change-type router
3. **Behavioral guidelines** — 3 absolute rules (Ukrainian primary, UTF-8 safety, decisions skill-only) + 5 how-to-work steps. Entire section is inside `<!-- FEEL framework rules -->` fences.
4. **Project excellency** — 4 points (FEEL docs, decision log, proportional ceremony, Ukrainian text safety)
5. **Sticky facts** — Jira epic, Supabase project, CF Pages env vars, build command, package version, pending tasks

Notable: **no "project rules" vs "FEEL framework rules" split** in behavioral guidelines — Landing's rules happen to be mostly framework-level (it has no domain-specific absolute rules like FEFO's Poster constraints). The fences still exist; they just wrap the whole section.

---

## feel.config.yaml highlights

- **External tracker:** Jira SCRUM project (shared with FEFO — same org, same project key)
- **Audiences:** 2 (`architect`, `developer`) — no end-users in scope for this doc network
- **Doc registry:** 5 docs, `landing-page-definition` marked `head_count_exempt: true`
- **Relations:** empty (no derived docs yet — the spec hasn't generated guides yet)
- **Comparison groups:** empty (only 4 docs; no meaningful clusters to watch)
- **Work modes:** 2 (`landing-content`, `doc-maintenance`)
- **Routines:** 5 `feel-*` core entries only
