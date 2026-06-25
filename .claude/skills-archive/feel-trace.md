---
description: Audit one feature end to end across spec, invariant, code, test, and guide. Reports which layers exist, which are missing, and whether they agree. Triggers on /feel-trace or any mention of "trace feature", "is feature N complete", "vertical slice", "spec to test", "feature coverage", "all layers present", "does this feature have a test", "feature completeness".
---

# feel-trace — vertical feature completeness check

Checks whether one feature is wired through spec, invariant, code, test, and guide.
Read-only; reports gaps and contradictions.

Read-only. Never creates or edits files.

---

## 1. Identify the feature

Parse `$ARGUMENTS`:
- A feature number (e.g. `4`, `Feature 4`) → look it up in the project's feature spec doc
- A feature name or short phrase (e.g. `checkout`, `notifications`) → find the
  matching feature by scanning section headings in the spec doc
- A developer story code (e.g. `D5`) → look it up in the developer stories doc

Read the matching feature section fully. Note: its number, name, the role it serves,
and the acceptance criteria.

---

## 2. Layer 1 — Spec

**Source:** The project's feature spec doc (or developer stories for D-series).

Check:
- Does the feature section exist?
- Does it have clear acceptance criteria (at least one "when / then" statement or
  equivalent)?
- Is its `app_version` current (not more than one minor version behind)?

Report: `[✓ spec]` or `[✗ spec — missing]` or `[⚠ spec — stale app_version]`.

---

## 3. Layer 2 — Invariant

**Source:** The project's invariants doc.

Search invariants for rules that reference this feature's domain (by topic keyword,
not by feature number — invariants don't have feature numbers). Look for:
- A rule that names the feature's primary noun (e.g. "checkout", "notification", "location")
- A constraint that would be violated if the feature misbehaved

Check:
- Is there at least one invariant that covers this feature's core behaviour?
- Does the invariant's wording match the spec's acceptance criteria (no contradiction)?

Report: `[✓ invariant — §Section name]` or `[✗ invariant — no covering rule found]`
or `[⚠ invariant — rule exists but may conflict with spec]`.

---

## 4. Layer 3 — Code anchor

**Source:** `CLAUDE.md` change-type router

Find the router row that most closely matches this feature's domain. Read the
"Code anchor" cell — it names the file(s) and function(s) that implement the feature.

Check:
- Do the named files exist?
- Do the named functions exist within them?
- Is the implementation complete (not a TODO stub)?

If the router doesn't have a row for this feature's domain, note that and try to
locate the relevant code by reading adjacent router rows and the spec's domain.

Report: `[✓ code — <file> <function>]` or `[✗ code — anchor not found]` or
`[⚠ code — function exists but is a TODO stub]`.

---

## 5. Layer 4 — Test

**Source:** The project's test directory.

Find the test file(s) that cover the code anchor from Layer 3. Look for:
- A test file named after the concept or the code module
- A test case named for the feature's concept (concept-level, not function-level)
- A comment linking the test to a doc (if the project uses comment-linked tests)

Check:
- Does a test case exist that covers the feature's primary acceptance criterion?
- Is there a test for the error / edge-case path (not just the happy path)?
- Does the test use dependency injection (no real I/O)?

Report: `[✓ test — <file> §<concept>]` or `[✗ test — no covering test]`
or `[⚠ test — happy path only, edge case not tested]`.

---

## 6. Layer 5 — Guide

**Source:** The project's user-facing guide docs (identified via `CLAUDE.md` doc
catalog or `feel.config.yaml` relations).

Search the appropriate guide for a section describing this feature to the end user.

Check:
- Is there a section that describes how to perform this action?
- Is the language correct for the audience (check project conventions)?
- Is the `app_version` of the guide current (inherited from the feature spec)?

Report: `[✓ guide — <guide> §<section>]` or `[✗ guide — feature not described
in guide]` or `[⚠ guide — section exists but app_version lags spec]`.

---

## 7. Consistency check

Look for contradictions across layers:
- Does the spec say "user A can do X" but the invariant says "only role B can do X"?
- Does the code implement a different quantity calculation than the spec describes?
- Does the guide describe a flow that no longer matches the current spec?

If any contradiction is found, flag it as `[! contradiction — Layer A vs Layer B]`
with a one-line description of the conflict.

---

## 8. Print the trace report

```
Feature trace — Feature N: <name>  (<role>)
────────────────────────────────────────────
Layer 1  Spec        [✓]  feature-spec §Feature N — app_version X.Y.Z
Layer 2  Invariant   [✓]  invariants §Section — relevant rule
Layer 3  Code        [✓]  <file> + <file> <function>
Layer 4  Test        [⚠]  <test-file> — happy path only; edge case missing
Layer 5  Guide       [✗]  <guide> — feature flow not described
────────────────────────────────────────────
Contradictions  none
Gaps            2 (Layer 4 warning, Layer 5 missing)

Next actions
  Layer 4  → Add edge-case test to <test-file>
  Layer 5  → Add §<section> to <guide>, then /feel-doc
```

If all layers are present and consistent, say so: "All five layers present and
consistent. No action needed."

---

## Contract

**Requires**
- A feature spec doc (referenced in `CLAUDE.md` doc catalog)
- An invariants doc
- `CLAUDE.md` with a change-type router
- A test directory

**Guarantees**
- Every reported layer status includes its evidence (file + section)
- Contradictions are reported as-found, not suppressed because they're uncomfortable
- "Missing" means absent, not "I didn't find it" — the skill searches thoroughly
  before declaring a layer missing

**Never**
- Creates missing layers (only reports them)
- Edits any file
- Marks a layer as ✓ without finding concrete evidence

---

## Argument

`$ARGUMENTS` — a feature number (e.g. `4`), a feature name (e.g. `checkout`), or a
developer story code (e.g. `D5`). If multiple features are named, trace them one at
a time. If empty, ask which feature to trace.
