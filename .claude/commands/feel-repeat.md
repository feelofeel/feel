---
description: Audit FEEL docs and the skill layer for repetition, stale relations, oversized files, and skill drift. Checks declared links, comparison groups, duplication, head-count thresholds, and skill hygiene (duplicates, dangling references, missing contracts, portability leaks) without editing. Triggers on /feel-repeat or any mention of "check doc repetition", "doc staleness", "repeated concepts", "sync derived docs", "is this duplicated", "doc too long", "split a doc", "head count check", "doc size check", "skill hygiene", "skill drift", "duplicate skills".
---

# feel-repeat — FEEL network health check

Read-only audit for stale, duplicated, or oversized FEEL docs.
It reports evidence and recommended actions; it never edits docs, calls `/feel-doc`, or modifies `feel.config.yaml`.

---

## 1. Determine mode from `$ARGUMENTS`

- **Named doc id** (e.g. `architecture`, `invariants`) → *single-doc mode*: analyse
  that doc against its comparison groups and its direct declared relations.
- `--diff` → *diff mode*: first run `node tools/ai-context/diff-extract.mjs --name-only`
  to collect the list of recently changed files; resolve each changed file path to
  a FEEL doc id by cross-referencing the `docs` registry in `feel.config.yaml`;
  then run single-doc analysis on every resolved id.
- **Empty** → *full-graph mode*: scan all comparison groups and all declared
  relations in `feel.config.yaml`.

---

## 2. Load `docs/feel.config.yaml`

Read and parse `docs/feel.config.yaml`. You need five sections: `audiences`,
`docs`, `relations`, `comparison_groups`, and `head_count` thresholds.

If the file does not exist, note it and **degrade gracefully**: run relation-symmetry
checks only using the FEEL heads of every doc you can locate under `docs/`. Skip
comparison-group analysis and head-count checks until the config exists.

---

## 3. Relation symmetry check

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

## 4. Staleness check on declared relations

For every source/derived pair in `relations`:

- Compare `app_version` fields. If the source's `app_version` is greater than the
  derived doc's `app_version` → **stale derived doc** (the source was updated in a
  product version the derived doc has never seen).
- Compare `updated` dates. If the source's `updated` date is more than approximately
  14 days ahead of the derived doc's → **potentially stale** (softer signal — may be
  intentional; report the date gap so a human can judge).

---

## 5. Comparison group version analysis

For every group in `comparison_groups`:

1. Read the FEEL heads of all member docs.
2. Find the most recently updated doc in the group (by `updated` date).
3. Find any member doc whose `updated` date is more than ~14 days behind the most
   recent member → **potentially stale sibling**.
4. Compare `app_version` across the group. Any doc that is more than one minor
   version behind the group's most-advanced `app_version` → **version-lagged
   sibling**.

Do not read full doc bodies for this step. The signal is metadata — dates and
versions. This keeps the check fast and avoids false positives from intentionally
different content levels.

---

## 6. Plan-doc staleness check

A `role: plan` doc is forward-looking by nature, so it goes stale differently from a spec: the risk is not that it lags a source, but that **planning has silently moved elsewhere** (an external tracker, another team's board) while the file keeps claiming to be the plan.

If `feel.config.yaml` defines a `plan_staleness` section, apply it to every doc with `role: plan`:

1. Find the doc's last *meaningful* content change (not head-only bumps):
   `git log --format="%h %ad %s" --date=short -- <path>` — read past commits whose subject is only a head/version sweep.
2. Count how many `app_version` releases shipped since that change (compare against `CHANGELOG.md` releases, or the current `app_version` against the doc's `app_version` at its last real edit).
3. If that count ≥ `plan_staleness.stale_after_releases` while the app kept shipping → **stale plan** finding.

Report it with `plan_staleness.action`: recommend migrating any still-live items to the project's external planning tracker (`external_tracker` in `feel.config.yaml`, if declared) and reducing the doc to a pointer stub — or deleting it. Never auto-edit. This is the heuristic that catches a roadmap nobody updates because the real backlog now lives in an issue tracker.

---

## 7. Within-doc repetition scan

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

## 8. Head-count heuristic

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

## 9. Skill-layer audit

Skills accrete and drift exactly like docs — duplicate copies pile up, references
dangle, contracts go missing, and a portable `feel-*` skill quietly picks up a
host-project term. Audit the skill layer the same way, over both directories:
`.claude/commands/` (active) and `feel/skills/` (archived).

1. **Duplicates across active/archived.** For any skill name present in both
   directories, diff them. An archived copy identical to — or an older subset of —
   its active twin is stale cruft → **skill-duplicate** (recommend deleting the
   archived copy; git keeps history).
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

## 10. Classify and report

For each finding, emit a structured entry:

```
[TYPE]  <doc-id> → <doc-id>  |  or  <doc-id> §Section  →  §Section
  Classification : broken-link | undeclared | stale | stale-plan | accidental
                 | verify-intentional | within-doc | heading-warning | heading-split
                 | size-warning | size-split | split-recommended
                 | skill-duplicate | skill-dangling-ref | skill-no-contract
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

7. **skill-hygiene** — a §9 skill-layer finding. Delete a stale archived duplicate,
   degrade or reactivate a dangling reference, add a missing `## Contract`, or strip a
   host-project term from a `feel-*` skill. The owner confirms deletions.

---

## 11. Print the summary block last

```
FEEL repeat audit — <today's date>
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
  optional `plan_staleness` enables the §6 plan-doc check
- `git` history access for the §6 plan-doc last-meaningful-change lookup
- Read access to all doc files in the registry
- Read access to the skill directories (`.claude/commands/`, `feel/skills/`) for the §9 skill-layer audit

**Guarantees**
- Every finding cites specific evidence (file, field value, line count)
- Head-count findings always include the doc's `role` and `head_count_exempt` status
- Zero-finding runs are reported explicitly ("All checks passed")

**Never**
- Edits any doc file
- Calls `/feel-doc` or modifies `feel.config.yaml` automatically
- Marks a layer or relation as compliant without reading the actual file

## Argument

`$ARGUMENTS` — a FEEL doc id (e.g. `architecture`), or `--diff` to check recently
changed docs against the diff, or empty to run a full-graph scan of all groups,
relations, and registered docs (full-graph mode also runs the §9 skill-layer audit).

When empty, Claude infers from context: if there are recently edited doc files in
the session, treat them as the target (equivalent to `--diff`). If no recent edits
are evident, run full-graph mode.
