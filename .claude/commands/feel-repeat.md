---
description: Audit FEEL docs and skills for malformed or inconsistent heads, broken relations, staleness, repetition, size, reader-mode drift, and skill drift without editing. Uses git for diff/history evidence when available and degrades to session paths plus doc metadata when it is not. Triggers on /feel-repeat or any mention of "check doc repetition", "doc staleness", "repeated concepts", "sync derived docs", "is this duplicated", "doc too long", "head validation", "Diátaxis audit", "skill hygiene", "skill drift", "duplicate skills".
---

# feel-repeat — FEEL network health check

Read-only audit for stale, duplicated, or oversized FEEL docs.
It reports evidence and recommended actions; it never edits docs, calls `/feel-doc`, or modifies `feel.config.yaml`.

---

## 1. Determine mode from `$ARGUMENTS`

- **Named doc id** (e.g. `architecture`, `invariants`) → *single-doc mode*: analyse
  that doc against its comparison groups and its direct declared relations.
- `--diff` → *changed-doc mode*: if git is available, use concise status/diff names.
  If git or commits are unavailable, use doc paths touched in the current session.
  Resolve those paths through the config registry. If neither source identifies a
  path, ask for a doc id or run full-graph mode; do not fail or invent a diff.
- **Empty** → *full-graph mode*: scan all comparison groups and all declared
  relations in `feel.config.yaml`.

---

## 2. Load `docs/feel.config.yaml`

Read and parse `docs/feel.config.yaml`. Core sections are `audiences`, `docs`,
`relations`, `comparison_groups`, and `head_count`. Also load optional
`vocabularies`, `publications`, and `skill_paths` sections when present.

If the file does not exist, note it and **degrade gracefully**: run relation-symmetry
checks only using the FEEL heads of every doc you can locate under `docs/`. Skip
comparison-group analysis and head-count checks until the config exists.

---

## 3. Complete-head and reader-mode audit

For every registered doc in scope, read YAML from the opening `---` through the
closing `---`. If the closing delimiter is absent, report **malformed-head** and do
not guess where the body starts. If `head_lines` exists, verify it reaches at least
the closing delimiter and then use it only for the declared post-YAML navigation
zone.

Check the mandatory core fields: `title`, `id`, `role`, `status`, `doc_revision`,
`updated`, `source_of`, and `derived_from`. Validate `role`, `status`, `diataxis`,
and `page_kind` against configured vocabularies. Preserve unknown optional fields;
an unknown key is not an error unless a configured publication contract rejects it.

For every configured publication whose `source_root` contains the doc:

- verify every field in `requires` exists;
- require every `article_requires` field on `page_kind: article`;
- reject every `landing_omits` field on `page_kind: landing`;
- report a configured validator failure as **publication-invalid**.

For internal docs, `diataxis` is optional. When present, spot-check the body:

- tutorial = guided skill acquisition, one safe managed path;
- how-to = a competent reader accomplishing a real task, with branches as needed;
- reference = neutral factual lookup structured around the thing described;
- explanation = context, connections, rationale, and understanding.

Report **mixed-reader-mode** only with concrete contradictory evidence. A FEEL
`role` differing from `diataxis` is not itself a conflict; the dimensions are
orthogonal. Specs, indexes, logs, plans, and research normally omit the mode.

---

## 4. Relation symmetry check

For every pair listed in the `relations` section of `feel.config.yaml`:

1. Open the **source** doc's FEEL head. Verify its `source_of` list contains the
   derived doc's `id`.
2. Open the **derived** doc's FEEL head. Verify its `derived_from` list contains
   the source doc's `id`.
3. Any mismatch → **broken link** (highest-priority finding).

Also scan every doc head you read for `source_of` / `derived_from` entries that do
*not* appear in `feel.config.yaml`'s relations section → **undeclared relation**
(either a bug or the config is out of date; flag it).

---

## 5. Staleness check on declared relations

For every source/derived pair in `relations`:

- When both docs carry the same release-stream field, compare it. A newer source
  stamp → **stale derived doc**. When no stream exists, skip this signal and rely
  on revision/date evidence.
- Compare `updated` dates. If the source's `updated` date is more than approximately
  14 days ahead of the derived doc's → **potentially stale** (softer signal — may be
  intentional; report the date gap so a human can judge).

---

## 6. Comparison group version analysis

For every group in `comparison_groups`:

1. Read the FEEL heads of all member docs.
2. Find the most recently updated doc in the group (by `updated` date).
3. Find any member doc whose `updated` date is more than ~14 days behind the most
   recent member → **potentially stale sibling**.
4. Compare a common release-stream field only when group members carry one. A doc
   more than one minor version behind → **version-lagged sibling**. With no common
   stream, report date/revision evidence only.

Do not read full doc bodies for this step. The signal is metadata — dates and
versions. This keeps the check fast and avoids false positives from intentionally
different content levels.

---

## 7. Plan-doc staleness check

A `role: plan` doc is forward-looking by nature, so it goes stale differently from a spec: the risk is not that it lags a source, but that **planning has silently moved elsewhere** (an external tracker, another team's board) while the file keeps claiming to be the plan.

If `feel.config.yaml` defines a `plan_staleness` section, apply it to every doc with `role: plan`:

1. With git history, find the last meaningful content change and ignore head-only
   sweeps. This is the strongest signal.
2. Without git, compare the head's `updated` date and optional stream stamp against
   the current release source. Label the result **weaker evidence**; do not claim to
   know whether an edit was meaningful.
3. If neither history nor a release stream exists, skip release-count staleness and
   report only obvious dead pointers or contradictory plan status.

Report it with `plan_staleness.action`: recommend migrating any still-live items to the project's external planning tracker (`external_tracker` in `feel.config.yaml`, if declared) and reducing the doc to a pointer stub — or deleting it. Never auto-edit. This is the heuristic that catches a roadmap nobody updates because the real backlog now lives in an issue tracker.

---

## 8. Within-doc repetition scan

For each target doc (all docs in full-graph mode; the specified doc in single-doc
mode; the changed docs in diff mode):

1. Read the doc body.
2. Identify the H2 and H3 section headings and their content blocks.
3. Look for paragraphs or bullet points that clearly re-state a concept already
   established in another section of the same doc — same rule, same example, or
   same constraint written twice.
4. Flag each pair as **within-doc repetition**, naming the two sections involved.

This is a lighter, judgement-based check. Report candidates — do not guarantee
every flagged item is genuinely duplicated. The developer confirms.

---

## 9. Head-count heuristic

Don't count headings or characters by hand — the shared counter already does it
on disk and applies the `head_count` thresholds:

```bash
node tools/feel/health.mjs --sizes
```

Read the **Flags** column of its output for each target doc:

| Flag | Condition (from `feel.config.yaml` `head_count`) |
|---|---|
| `heading-warning` / `heading-split` | headings ≥ `heading_warning` (12) / ≥ `heading_split` (18) |
| `size-warning` / `size-split` | body chars ≥ `char_warning` (8,000) / ≥ `char_split` (15,000) |
| `split-recommended` | `heading-split` AND `size-split` both present |
| `(exempt)` | registry has `head_count_exempt: true` — downgrade one severity level |

When `split-recommended` appears, include the suggested action from
`head_count.split_action`: identify 3–5 coherent heading clusters, extract them
into new derived docs with `derived_from` pointing at the original, and run
`/feel-doc` on both. For an exempt doc, downgrade (split-recommended → warning;
warning → note). Always name the doc's `role` in the finding — `spec`/`reference`
docs are expected to be larger than `guide`/`convention` docs.

---

## 10. Skill-layer audit

Skills accrete and drift exactly like docs — duplicate copies pile up, references
dangle, contracts go missing, and a portable `feel-*` skill quietly picks up a
host-project term. Audit every active/archive directory declared by `skill_paths`;
default to `.claude/commands/` and `.claude/skills-archive/` when absent.

1. **Duplicates across active/archived.** For any skill name present in both
   directories, diff them. An archived copy identical to — or an older subset of —
   its active twin is stale cruft → **skill-duplicate**. Recommend deletion only
   when durable history or a recoverable archive exists.
2. **Dangling references.** Grep active skills for `/feel-*` and `/<project>-*`
   slash-command mentions. A referenced skill that is not active (archived-only or
   absent) → **skill-dangling-ref** (recommend degrading the mention to a suggestion,
   or reactivating the skill).
3. **Missing contracts.** Every active skill must carry a `## Contract` (requires /
   guarantees / never). An active skill without one → **skill-no-contract**.
4. **Portability leaks.** A `feel-*` skill is framework-generic and must not mention
   any host-project domain term. Grep `feel-*` skill files for the project's
   name/domain tokens. A hit → **skill-portability-leak** (the host project may be a
   concrete example, never the reason a rule exists — see `feel.md` §8 and
   `feel-adoption.md`).
5. **Orphans.** A skill file no entry-point references (absent from CLAUDE.md's
   skill-family list, not the active set, not the documented archived set) →
   **skill-orphan** (verify it is intentional).

Read skill bodies only as far as needed — frontmatter, `## Contract` presence, and
grep hits. This stays a metadata-level scan, like the doc checks above.

---

## 11. Classify and report

For each finding, emit a structured entry:

```
[TYPE]  <doc-id> → <doc-id>  |  or  <doc-id> §Section  →  §Section
  Classification : broken-link | undeclared | stale | stale-plan | accidental
                 | verify-intentional | within-doc | heading-warning | heading-split
                 | size-warning | size-split | split-recommended
                 | skill-duplicate | skill-dangling-ref | skill-no-contract
                  | malformed-head | missing-head-field | invalid-vocabulary
                  | publication-invalid | mixed-reader-mode
                  | skill-portability-leak | skill-orphan
  Evidence       : <specific metadata — versions, dates, heading counts, char counts>
  Action         : <one of the five actions below>
```

**Recommended actions:**

1. **add-relation** — two docs share a comparison group and same/overlapping
   audience, but no `source_of`/`derived_from` is declared. Add the pair to
   `feel.config.yaml` relations, then run `/feel-doc` on both docs.

2. **consolidate** — same audience, overlapping `guards`, no declared relation.
   Move the content to one doc; make the other a derived stub or remove the
   duplication. Run `/feel-doc` on both.

3. **update-derived** — a derived doc's `app_version` or `updated` lags its source.
   Run `/feel-doc` on the derived doc; sync its body; bump its head.

4. **verify-intentional** — overlap exists and a relation IS declared, but the
   config's `intent` string for this pair is missing or vague. No immediate action
   required; suggest adding an `intent` description to `feel.config.yaml`.

5. **trim-or-split** — head-count heuristic triggered. Trim prose (size-warning) or
   extract derived docs (split-recommended). Run `/feel-doc` after restructuring.

6. **migrate-and-stub** — a `role: plan` doc is stale past `plan_staleness`
   thresholds. Migrate still-live items to the external tracker, reduce the doc to a
   pointer stub (or delete it), then run `/feel-doc`. Human confirms which items are
   still live before migration.

7. **skill-hygiene** — a §10 skill-layer finding. Delete a stale archived duplicate,
   degrade or reactivate a dangling reference, add a missing `## Contract`, or strip a
   host-project term from a `feel-*` skill. The owner confirms deletions.

---

## 12. Print the summary block last

```
FEEL repeat audit — <today's date>
  Heads     :  N valid  /  N malformed  /  N metadata findings
  Relations :  N declared  /  N symmetric  /  N broken  /  N undeclared
  Staleness :  N derived docs lag their source
  Plans     :  N plan docs stale (planning likely moved to the tracker)
  Groups    :  N comparison groups  /  N siblings with version gaps
  Within-doc:  N within-doc repetitions flagged
  Size      :  N docs with heading/size findings  (N exempt)
  Skills    :  N duplicate  /  N dangling-ref  /  N no-contract  /  N portability-leak  /  N orphan
  ─────────────────────────────────────────────────────
  Total     :  N findings  (N critical  N warning  N note)
```

If there are zero findings, say so explicitly: "All checks passed — no findings."
Do not print the full findings table if it is empty.

---

## Contract

**Requires**
- `docs/feel.config.yaml` with `docs`, `relations`, `comparison_groups`, and
  `head_count` sections (degrades gracefully to relation-symmetry-only without it);
  optional `vocabularies`, `publications`, `skill_paths`, and `plan_staleness`
  enable the corresponding audits
- Optional git history access strengthens §7 but is not required
- Read access to all doc files in the registry
- Read access to configured active skill paths; archive paths are optional

**Guarantees**
- Every finding cites specific evidence (file, field value, line count)
- Every registered doc is checked through its closing YAML delimiter
- Diátaxis findings cite body evidence, never only a role/mode pairing
- Head-count findings always include the doc's `role` and `head_count_exempt` status
- Zero-finding runs are reported explicitly ("All checks passed")

**Never**
- Edits any doc file
- Calls `/feel-doc` or modifies `feel.config.yaml` automatically
- Marks a layer or relation as compliant without reading the actual file

## Argument

`$ARGUMENTS` — a FEEL doc id (e.g. `architecture`), or `--diff` to check recently
changed docs against the diff, or empty to run a full-graph scan of all groups,
relations, and registered docs (full-graph mode also runs the §10 skill-layer audit).

When empty, Claude infers from context: if there are recently edited doc files in
the session, treat them as the target (equivalent to `--diff`). If no recent edits
are evident, run full-graph mode.
