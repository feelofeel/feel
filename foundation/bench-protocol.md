---
title: eelbench — FEEL / no-FEEL benchmark protocol
id: feel-bench-protocol
role: research
status: draft
doc_revision: 1
updated: 2026-06-10
source_of: []
derived_from: [feel-promise]
---

# eelbench — protocol

Pre-registered design for testing claims C1 (cheap routing), C2 (correct routing), and C5 (bounded adoption cost) from [promise.md](promise.md). **Status `draft` until the freeze commit; after freeze, only §8 Results may change.** The freeze commit hash is recorded in §7 before any run.

## 1. Hypothesis

In a mid-size repo unfamiliar to the model, an AI coding agent completes routing-heavy maintenance tasks with **fewer tokens, fewer tool calls, and equal-or-better correctness** when the repo carries FEEL (heads + super-index + router) than when it carries its original documentation.

## 2. Why not FEFO, and why not synthetic tasks

- **Not FEFO:** its docs co-evolved with FEEL; the author of the docs and the author of the test would be the same person; agent project-memory of FEFO contaminates the control arm. Any FEFO result is ceiling-biased.
- **Not invented tasks:** tasks written by whoever knows the FEEL docs will drift toward what the index answers well. Tasks must come from a source that predates our involvement: the subject repo's own closed issues.

## 3. Subject repo — selection criteria

One third-party repo, selected mechanically, meeting all of:

1. **Node.js/JavaScript**, ~10–50k LOC (FEEL's home turf; FEEL is language-agnostic but the first bench shouldn't also test language transfer).
2. **Not famous** — roughly 300–2 000 GitHub stars, to limit training-data contamination.
3. **Contamination quiz passed:** before acceptance, ask the bench model 5 specific questions about the repo's internals *with no tools*. If it answers ≥2 correctly from memory, reject the repo.
4. **Ordinary docs** — a README plus some scattered markdown; neither docless nor exceptionally documented (the control must represent a typical repo).
5. **Active issue tracker** with ≥15 closed issues that have a linked fix PR touching ≤3 files.
6. Never authored by, contributed to, or previously opened in a session by us.

Shortlisting command (run, take the first repo down the list that passes 1–6):
`gh search repos --language=javascript --stars=300..2000 --sort=updated --limit=50`

## 4. Conditions

- **Arm A (control):** the repo as cloned. This is the buyer's real alternative — their repo today.
- **Arm B (FEEL):** the same commit plus FEEL adoption: heads on existing docs, `CLAUDE.md` super-index with change-type router, core skills. **No new prose knowledge may be added** — FEEL-ification restructures and indexes what the repo already says; writing new facts into docs would test authorship, not structure.
- **Arm C (optional, later):** original docs rewritten for quality but with no FEEL structure — isolates *structure* from *better prose*. Out of scope for run 1.

## 5. Task battery — mechanical selection

From the repo's closed issues, filtered mechanically (no curation): most recent 10 issues that (a) have a linked merged fix PR, (b) the fix touches ≤3 files, (c) the issue text doesn't name the fix location. Split by what the issue affords:

- **5 locate/explain tasks:** "Where is the behaviour described in issue #N implemented, and why does it occur?" Ground truth = files touched by the real fix PR.
- **5 small-change tasks:** "Resolve issue #N." Ground truth = the real merged fix (file match + behaviour match).

The task list is committed at freeze, **before** FEEL-ification begins.

## 6. Execution & measurement

- Runner: `claude -p` headless, `--output-format json` (captures token usage), same model and settings across all runs, fresh session per run, no project memory.
- **n = 3 runs** per task per arm (10 tasks × 2 arms × 3 = 60 sessions).
- Metrics per run: input tokens, output tokens, tool calls, distinct files read, wall time, correctness.
- **Correctness grading:** objective file-match against the real fix PR, plus a blind LLM judge (a different model) scoring the answer against a rubric written at freeze. Transcripts are stripped of any FEEL/control markers before judging.
- **Adoption cost (C5):** the FEEL-ification of Arm B is itself timed and token-metered, and reported in results as the cost side of the ledger.

## 7. Bias guards (summary) & freeze

1. Protocol, task list, and grading rubric committed **before** any FEEL doc for the subject repo exists (freeze commit: `________`).
2. Task selection is mechanical (§5); repo selection is mechanical (§3).
3. FEEL-ification is performed by a session that has not seen the task list, working only from the repo itself.
4. Grading is blind to condition.
5. All raw transcripts and the runner script are published with the results.
6. Negative or null results are published in [evidence.md](evidence.md) with the same prominence as positive ones.

## 8. Results

*(empty until run; append-only after freeze)*
