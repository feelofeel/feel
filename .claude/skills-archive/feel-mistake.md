---
description: Turn a mistake into a durable heuristic: name the root cause, classify the failure mode, and propose where the lesson should live. Triggers on /feel-mistake or any mention of "learn from this bug", "what went wrong", "root cause", "extract the lesson", "mistake audit", "what did we get wrong", "post-mortem", "this was a bad assumption", "scan for past mistakes".
---

# feel-mistake — mistake extraction and heuristic recovery

Extracts a durable lesson from a bug, wrong assumption, or bad design call.
Use it to propose an invariant, doc rule, or future check.

Two modes:
- **Active** — called during or just after a bugfix/correction session: analyse
  what went wrong, classify the failure mode, produce a durable heuristic.
- **Audit** — called to scan existing docs for crystallised past mistakes and
  surface the heuristics that are already implicit in the rules.

---

## Active mode — during a bugfix or after a wrong decision

### Step 1 — Name the mistake clearly

State the mistake in one sentence. Not the symptom — the actual mistake.

Good: "We stored the concurrent-batch flag at creation time rather than deriving
it at read time, so it went stale when shelves were introduced."

Not good: "There was a bug with the concurrent batch indicator."

The single-sentence form forces precision. If the sentence can't be written in
one line, the mistake hasn't been understood yet.

### Step 2 — Classify the failure mode

Every mistake belongs to one of these categories. Pick the most precise fit:

| Code | Failure mode | What it looks like |
|---|---|---|
| **A — Wrong assumption** | A premise was accepted without verification | "We assumed the API accepts the ID in the body, but it requires a query param" |
| **B — Premature optimisation** | An optimisation was made before the requirement was stable | "We stored a derived flag to avoid a query — then the requirement changed" |
| **C — Scope misread** | The boundary between our system's job and an external system's was wrong | "We re-implemented a calculation the upstream webhook already delivers" |
| **D — Silently wrong** | The system accepted the input but produced an incorrect result with no error | "The API call succeeded but the external system recorded a default value instead of ours" |
| **E — Test gap** | The behaviour existed but no test protected it | "The edge case had no test — it broke silently during a refactor" |
| **F — Stale derived state** | A value was derived once and stored, but the source changed | "A flag computed at creation went stale when a new grouping feature was added" |
| **G — Design escalation** | A UI or flow became more complex than the simplicity constraint allows | "Auto-cancel-on-blur interrupted date navigation on touch devices" |
| **H — Deferred clarity** | A requirement was marked 'infeasible' before being properly analysed | "Feature X was called infeasible — then we built it the next sprint" |

### Step 3 — Write the heuristic

A heuristic is a rule that fits in one sentence and prevents the same failure mode
from recurring. It should be:
- **Falsifiable**: "never store X when Y changes" rather than "be careful with X"
- **Actionable**: a developer can check against it before writing a line of code
- **Portable**: it should apply to other situations, not just this exact bug

Format: `[Failure mode code] Heuristic: <rule>`

Examples:
- `[D] Don't trust silent success — if an external API accepts a malformed request
  without an error, verify the output in the external system's own UI. Test all
  write paths against the actual record, not just the API response code.`
- `[F] Derive volatile state at read time, not write time. If a derived value
  depends on something that can change after creation (e.g. group membership,
  item config), compute it in the query — don't cache it in a column.`
- `[C] Never re-implement what the upstream system already does. Before adding any
  calculation, check whether the webhook or API already delivers the answer.`
- `[B] Don't store what you haven't stabilised. Optimise for correctness first —
  materialise a derived value in a column only when the requirement is locked
  and the query cost is proven.`

### Step 4 — Decide where the heuristic lives

A heuristic that's worth keeping must go somewhere it will be read before the
next similar decision:

| Home | When to use it |
|---|---|
| Invariants doc | Load-bearing rules a developer must not break — for heuristics that are architectural constraints |
| API/integration reference doc | External API gotchas — for `[A]` and `[D]` failures involving external systems |
| `CLAUDE.md` absolute rules | Behavioural constraints that apply to all sessions — only for the most universal |
| `docs/conventions/feel.md` or skill contracts | FEEL or skill-level constraints — for `[E]` gaps in skill design |
| Decision log | Append-only staging — for heuristics not yet absorbed into a permanent home |

Propose the home; don't write to it directly. Let the user confirm, then call the
appropriate skill (`/feel-doc`, `/feel-decision`).

### Step 5 — Check for a test gap

For `[E]` failures, and often for others: is there a test that now needs writing?

Name the test concept (not the implementation), the file it belongs in, and the
acceptance criterion it should protect. Do not write the test — flag the gap for
the developer.

---

## Audit mode — scan existing docs for crystallised mistakes

### Step A — Identify mistake-derived rules

Read the project's key docs in order:
1. The invariants doc — every rule that says "must not", "never", "guards against",
   or names a specific failure scenario is a candidate
2. The decision log — rows where the `decision` column contains a correction, a
   reversal, or a reference to a bug are explicit crystallised mistakes
3. Any API/integration reference doc — gotcha entries are almost always mistake-derived

For each candidate rule, determine: does this exist because someone tried the
wrong thing first? If yes, it's a crystallised mistake.

### Step B — Surface implicit heuristics

Some rules protect against a mistake without naming it. For each crystallised-
mistake rule, ask: is the *failure mode* named, or just the prohibition?

If only the prohibition is named, derive the heuristic explicitly:

```
Rule (from invariants): "param X must be a URL query param, NOT in the JSON body"
Failure mode: [D] Silently wrong
Implicit heuristic: Don't trust silent success from external write APIs.
                    Verify the actual record, not just the HTTP response code.
Is it stated anywhere? No — only the workaround is documented, not the principle.
Recommendation: Add to the API reference doc (or feel-doc it into invariants)
```

### Step C — Produce the audit report

```
feel-mistake audit — <today's date>

Crystallised mistakes found: N

1. API param placement  [D — silently wrong]
   Rule: invariants §API quirks
   Heuristic: implicit (not stated) → recommend surfacing
   Test: covered by integration test? Unknown — check relevant test file

2. Derived flag staleness  [F — stale derived state]
   Rule: invariants §Lifecycle + architecture §rationale
   Heuristic: "Derive volatile state at read time" — partially stated in decisions
   Action: fully absorb into invariants; prune the decisions row

3. Echo guard  [E — test gap caught and fixed]
   Rule: invariants §Connector rules
   Heuristic: "A write-back triggers its own echo — guard against it" — stated
   Test: covered ✓

... (all found)

Summary
  N rules that are implicit mistakes  →  N heuristics not yet named
  N already explicit                  →  no action needed
  N test gaps found
```

---

## Contract

**Requires**
- For active mode: a clearly identified mistake to analyse (from `$ARGUMENTS` or
  current session context)
- For audit mode: at least an invariants doc and a decision log

**Guarantees**
- Every heuristic is falsifiable and names its failure mode code
- Proposed home for each heuristic is explicit (never vague "document this")
- Audit report shows both implicit (not yet named) and explicit heuristics

**Never**
- Writes to any doc file (proposes homes; calls `/feel-doc` or `/feel-decision`
  only when user confirms)
- Classifies a mistake without naming the root cause sentence (precision first)
- Treats all mistakes as equally important — severity and recurrence risk inform
  priority

---

## Argument

`$ARGUMENTS`:
- Empty → infer from context: if there's an active bugfix session, run active mode;
  if no recent mistake is obvious, ask or default to audit mode
- A short description of the mistake → active mode on that mistake
- `audit` or `--audit` → audit mode: scan docs for crystallised past mistakes
- `--heuristics` → audit mode, report only: list all found heuristics (named and
  implicit) without the full mistake context
