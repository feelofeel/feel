# FEEL Example: FEFO (SORT App)

**Repo:** `github.com/feelofeel/fefo` (private)  
**Layer:** L3 + L4 (full: heads + index + ceremony + skills + release train)  
**feel_version:** 1.1  
**Docs:** ~30 docs across specs, guides, rationale, conventions, history  
**Adopted:** 2026 (FEEL originated here before extraction)

---

## What makes this adoption distinctive

### 1. L4 Release train

FEFO has a `fefo-release` project skill that runs at version cut: bumps both `package.json` files (monorepo), sweeps `app_version` across all doc heads via Bash `sed` (never PowerShell — UTF-8 safety), finalizes CHANGELOG `[Unreleased]`, prunes the decision log, and tags/pushes. This is the canonical example of L4 ceremony.

Key constraint: **Bash `sed` for bulk UTF-8 doc-head sweeps.** PowerShell 5.1 `Set-Content` re-encodes BOM-less UTF-8 as Windows-1252 silently. All bulk doc edits go through Bash or a Node script.

### 2. Project skills family

FEFO has ~8 `fefo-*` project skills alongside the 5 `feel-*` core skills:

- `fefo-changelog` — classify SemVer from barista/manager POV; add [Unreleased] bullets
- `fefo-migration` — Supabase schema migrations (SQL file → dev apply → prod apply → sticky-fact update)
- `fefo-release` — full release cut (L4 ceremony)
- `fefo-radar` — code-health scanner (sole writer of `docs/health/code-radar.md`)
- `fefo-poster-call` — before any Poster API call: scan local docs, cross-check reference
- `fefo-preview` — deploy dev build to Cloudflare Pages
- `fefo-status` — session-start environment health check
- `fefo-worktree` — worktree protocol for ≥2 parallel streams

Pattern: **each project skill is a thin ceremony wrapper** around a project-specific operation. The skill owns one register file (e.g. `fefo-radar` ↔ `code-radar.md`; `fefo-migration` ↔ migration slot tracking in CLAUDE.md sticky facts).

### 3. Jira ↔ FEEL connector

Every Jira ticket description carries a `## FEEL docs` block listing relevant doc ids. Docs may carry a `tracker: SCRUM-NNN` field in their FEEL head (removed when the work closes — it's a convenience link, not a permanent relation). Conventions in `docs/conventions/jira-templates.md`.

This pattern: **external tracker ↔ FEEL doc network** is portable. Replace `SCRUM` with your project's Jira project or equivalent.

### 4. Multi-tenancy ceremony

All DB writes, auth flows, and webhook handling carry a safety-ceremony flag in FEFO's `feel.config.yaml`:

```yaml
ceremony_levels:
  safety:
    includes: [poster_writes, migrations, prod, auth, tenancy]
```

The `tenancy` item is a project-specific safety concern. Pattern: **extend the `includes` list to name your project's high-risk operations.** The FRAMEWORK SCHEMA has `external_writes, migrations, prod, auth, tenancy` as a starting set — replace the domain-specific terms with yours.

### 5. Concurrent worktrees protocol

When ≥2 work streams run in parallel, each gets a `ws/<slug>` branch and a dedicated worktree (via `tools/worktree.mjs`). A main-guard hook blocks direct commits to `main` during a multi-stream phase. This is FEFO's instantiation of FEEL's ceremony-levels for concurrent work — the protocol is documented in `docs/conventions/concurrent-workstreams.md` (a derived doc of `feel.md` + `architecture.md`).

Pattern: **the worktree protocol is optional L4+ behavior** — only needed when parallel streams actually collide.

---

## CLAUDE.md shape

FEFO's super-index has five sections:

1. **Identity paragraph** — one-sentence what + core value
2. **Super-index** — doc catalog (grouped by role) + change-type router (15 rows)
3. **Behavioral guidelines** — absolute rules (Poster-specific, barista 1-tap, Ukrainian UI, UTF-8 safety, dev/prod discipline) + how-to-work + ceremony levels. Fenced with `<!-- SORT project rules -->` and `<!-- FEEL framework rules -->` comments.
4. **Project excellency** — FEFO's definition of "good" (tests, migrations, Poster ownership, FEEL docs)
5. **Sticky facts** — prod/dev endpoints, tenant IDs, Supabase migration next-number, Railway/Cloudflare identifiers, Jira URL

The fences let you distinguish portable framework rules from FEFO's domain rules at a glance.

---

## feel.config.yaml highlights

- **External tracker:** Jira SCRUM project, with `cloud_id` for MCP tool calls
- **Audiences:** 5 (`architect`, `developer`, `operator`, `barista`, `manager`)
- **Doc registry:** ~30 docs, each with `audience`, `guards`, and optional `head_count_exempt`
- **Comparison groups:** 4 (`batch-lifecycle`, `poster-quirks`, `multi-tenancy`, `poster-configuration`) — these are the clusters `feel-repeat` checks for staleness and duplication
- **Routines:** 5 `feel-*` core + 4 `fefo-*` project-specific entries
