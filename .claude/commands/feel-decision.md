---
description: The only sanctioned writer of docs/history/decisions.md. Appends non-obvious decisions in every project; prunes absorbed rows only when durable version history already preserves them. Works without git by keeping the log append-only. Triggers on /feel-decision or any mention of "log a decision", "record a decision", "decision log", "prune decisions", "clean the decision log".
---

# FEEL decision-log workflow

`docs/history/decisions.md` is skill-only. Append works everywhere. Pruning is an
optimization available only when durable history already preserves the rows.

Rows use `| date | decision | codified in |` inside dated phase tables.

## Mode A — append

1. Confirm the choice is non-obvious and future work could reasonably do the opposite.
2. Put the substance in the governing rationale, reference, or spec first; run
   `/feel-doc` on that doc. If absorption would be disproportionate now, name the
   intended target with `(pending)`; pending is a debt marker, never an archive.
3. Add one dated, one-line row. Keep rationale out of the log.
4. Refresh the log head's `updated` and `doc_revision`; refresh a stream stamp only
   when the project defines one.

Git, commits, a changelog, and an external tracker are not required for append mode.

## Mode B — prune-audit

1. Verify durable history before proposing deletion. Prefer tracked git history for
   `docs/history/decisions.md`; an untracked file or repository with no commits does
   not qualify. A project-declared immutable archive may qualify instead.
2. Read each `codified in` target and list absorbed/not-found candidates with evidence.
   Treat `(pending)` rows as absorption candidates: offer to write the substance and
   remove the marker, but never propose pruning them.
3. If durable history is unavailable, stop after the report: leave every row in place
   and say pruning is disabled until history or an archive exists.
4. If durable history exists, present the complete candidate list and delete only
   rows the user explicitly approves.
5. Fix links affected by approved pruning and refresh the head.

The no-history mode is intentionally append-only. It preserves decisions while the
project is offline, local-only, or waiting for version-control access.

## Contract

**Requires** `docs/history/decisions.md` with a FEEL head and phase-table structure;
append mode also requires the substance to exist in its governing doc or its target
to be explicitly marked `(pending)`.

**Guarantees**
- Append mode works without git or commits
- Every new row follows the three-column format
- Prune candidates are shown before deletion
- Deletion occurs only with both durable history and explicit user approval
- Pending rows are never pruned and lose the marker only after absorption
- The head is refreshed after a write, without inventing a release stream

**Never**
- Edits any other doc or creates the decisions file
- Deletes when the file is untracked, has no durable history, or approval is absent
- Treats a filesystem backup assumption as proven history
- Adds substantive rationale to the log

## Argument

`$ARGUMENTS`: a decision sentence selects append; `prune`, `clean`, or `audit`
selects prune-audit; empty infers the mode from context.
