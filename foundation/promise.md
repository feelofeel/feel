---
title: The FEEL Promise — claims and their evidence status
id: feel-promise
role: spec
status: draft
doc_revision: 1
updated: 2026-06-10
source_of: [feel-evidence]
derived_from: []
---

# The FEEL promise

What FEEL claims, in falsifiable form. Each claim names its measure and its current evidence status. Statuses are upgraded only by entries in [evidence.md](evidence.md); marketing copy may never run ahead of this table.

**Evidence vocabulary:** `unproven` → `plausible` (mechanism argued, no measurement) → `demonstrated n=1` (one real project, authored environment) → `measured` (eelbench or equivalent, pre-registered).

## Claims

| # | Claim | Falsifiable form | Status |
|---|---|---|---|
| C1 | **Cheap routing.** An AI agent in a FEEL repo reaches the right files with fewer reads and fewer tokens than in the same repo without FEEL. | Tokens, tool calls, and files-read per task, FEEL arm vs control arm, same tasks, same model ([bench-protocol](bench-protocol.md)) | plausible |
| C2 | **Correct routing.** The agent answers repo questions and lands small changes in the right place more often. | Task correctness rate vs control arm, blind-graded | plausible |
| C3 | **Docs stay true.** Proportional ceremony keeps docs synced with code instead of rotting. | Share of behaviour-changing commits that also touch docs; staleness audits over time | demonstrated n=1 (FEFO) |
| C4 | **Solo leverage.** One person plus an agent ships and operates production software under FEEL. | Existence proof: a real multi-tenant SaaS in production | demonstrated n=1 (FEFO) |
| C5 | **Bounded adoption cost.** FEEL-ifying an existing mid-size repo costs hours, not weeks. | Wall time + tokens of the bench FEEL-ification, reported in results | unproven |

## What FEEL does not promise

- **Better code.** FEEL routes attention; it doesn't review, test, or design. Quality still comes from tests and judgment.
- **Value without upkeep.** Heads that aren't bumped become lies; the system's worth tracks the ceremony actually practiced.
- **Superiority over any structured docs.** A disciplined README culture captures part of the same value. Whether FEEL's *structure* beats merely *good prose* is an open question (optional arm C in the bench isolates it).
- **Team-scale results.** All current evidence is single-user, single-repo. Multi-user claims wait for multi-user evidence.

## The honest pitch boundary

Until C1/C2 are `measured`: sell the existence proof (C4), the sync discipline (C3), and the mechanism argument — not numbers. After the bench: sell whatever the numbers actually say, including the adoption cost (C5).
