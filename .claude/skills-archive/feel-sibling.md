---
description: Scan for sibling bugs after a root cause is found. Extracts the structural pattern, checks similar implementations for the same gap, and returns ranked findings. Triggers on /feel-sibling or any mention of "does this affect similar features", "find sibling patterns", "where else might this exist", "same root cause elsewhere", "horizontal scan", "other instances of this pattern", "spread of this bug", "similar gap", "siblings of this bug".
---

# feel-sibling — horizontal sibling scan

Finds places where the same root-cause pattern may repeat elsewhere. Read-only:
returns ranked findings, not fixes.

**`feel-trace` is vertical** (one feature, all layers). **`feel-sibling` is
horizontal** (one structural pattern, all instances). Together they cover both
axes of a feature's health.

Typical workflow: `/feel-mistake` → name the heuristic → `/feel-sibling` →
scan for siblings → fix or add tests → changelog skill.

---

## Step 1 — Extract the structural pattern

From `$ARGUMENTS`, or from the most recently fixed bug in the session,
identify three things:

- **Guard type:** what kind of construct is doing the gatekeeping?
  _allowlist / enum / validator map / auth filter / route middleware /
  DB column constraint / cron expression / event type / etc._
- **Protocol it guards:** what set of values does it govern?
  _API keys, webhook action names, role names, push categories, etc._
- **Miss shape:** how did the gap appear?
  _New entry added to the protocol but not registered in the guard;
  guard hard-coded while protocol grew; guard in a different file from
  the protocol it guards._

Name the pattern in one line, e.g.:
_"Explicit key allowlist whose entries must be manually kept in sync with
the API contract."_

---

## Step 2 — Locate all sibling guards

Search the codebase for instances of the same structural construct. Look for:

**By naming:**
- `ALLOWED_*`, `VALID_*`, `PERMITTED_*`, `WHITELIST`, `ACCEPTED_*`
- Objects used exclusively as validators: `{ key: (v) => boolean, ... }`

**By idiom:**
- `if (!GUARD[key]) { rejected.push(...) }` or `switch` with default-reject
- Middleware that checks against a fixed set before processing
- Hardcoded arrays used in `.includes()` or `Set` membership tests

**By protocol domain:**
- If the original guard protected API settings keys → look for other settings-adjacent validators
- If it protected webhook action names → look in `routes/webhook.js` and its callers
- If it protected role names → look across auth middleware and push filters

List every file path and line number where a sibling guard appears. Do not
filter speculatively — list them all, even if they look correct. Classification
comes in Step 5.

---

## Step 3 — Check each sibling for the same gap

For each sibling guard found in Step 2, cross-reference what the guard
registers against what the protocol currently sends or expects. Read:

- **Frontend / client code:** what keys/values does the component or script
  actually send? (Check fetch calls, form submit handlers, PATCH body builders.)
- **DB schema:** what columns exist in the relevant table that could signal
  valid values? (Check migration files and the database schema.)
- **Docs:** what does the feature spec, invariants, or any relevant doc say
  the protocol supports? (A feature described in a doc but absent from the
  guard is a confirmed gap.)

Flag any discrepancy: a key, action, or value that is documented, sent, or
stored — but absent from the guard.

---

## Step 4 — Check test coverage

For each sibling guard, ask: _Is there a test that would have caught the
original miss?_

A passing test for today's bug would have submitted the full set of known
keys to the PATCH/POST endpoint and asserted each was accepted — or unit-tested
the validator map exhaustively against the API contract.

Flag guards that have no such test as a **test gap**, independently of whether
they currently have a content gap. A guard that happens to be correct today
but has no test is a latent risk.

---

## Step 5 — Classify and rank findings

| Confidence | Meaning |
|---|---|
| `HIGH` | Gap confirmed — a documented or sent key is absent from the guard |
| `MEDIUM` | Plausible — guard looks thin relative to what the protocol supports; not confirmed without more context |
| `LOW` | Looks complete — guard entries match the protocol; no test gap found |

Sort output: HIGH → MEDIUM → LOW.

---

## Step 6 — Produce the sibling report

Print a block for each sibling:

```
[HIGH/MEDIUM/LOW] path/to/file.js:line — GuardName
  Pattern: <one-line description of what the guard does>
  Gap:     <what is missing or thin>   (or "none found")
  Test:    gap / covered / unknown
  Action:  fix code | add test | update doc | ok
```

Close with a summary line:

```
feel-sibling scan — N siblings | X HIGH | Y MEDIUM | Z LOW
Root cause pattern: <the pattern named in Step 1>
```

---

## Step 7 — Offer to carry HIGH findings to the ghost queue

If any HIGH findings exist, offer to emit them as 👻 ghost items so they
appear as task chips and can be carried into the next session or promoted to
inline tasks. Do not auto-fix anything.

---

## Contract

**Requires**
- A root cause description (from `$ARGUMENTS` or the most recently discussed
  bug or fix in the current session)
- Read access to source files, migration files, and doc files

**Guarantees**
- Every file matching the guard pattern is listed before classification — no
  speculative filtering in Step 2
- Each finding carries exactly one recommended action
- HIGH findings are always offered to the ghost queue
- The report distinguishes content gaps (wrong or missing entry in the guard)
  from test gaps (guard is correct today but unprotected by a test)

**Never**
- Edits any file — only reports findings and offers ghost items
- Invokes other skills autonomously — the user decides what to do with the report
- Marks `LOW` findings as requiring action — `ok` is a complete and valid result
- Confuses its scope with `feel-mistake` (which names a heuristic and finds its
  permanent home) — `feel-sibling` finds where the gap might exist, not what to
  learn from it

---

## Argument

`$ARGUMENTS` is an optional short description of the root cause or bug
(e.g., `"allowlist missing key"`, `"ALLOWED_KEYS settings.js"`).

- If empty: infer from the most recently fixed bug or discussed issue in the
  session. If no recent bug context is clear, ask before scanning.
- A description of the guard → scan that pattern across the codebase.
- A file path → use that file's guard as the reference instance; find its
  siblings in other files.
