---
description: Suggest token-saving edits for verbose docs. Flags redundant preambles, heading restatements, over-explained examples, and repeated paragraphs; --apply drafts tighter prose without removing information. Triggers on /feel-shrink or any mention of "shrink this doc", "compress docs", "trim prose", "doc too verbose", "tighten this", "reduce token cost", "this doc is too long", "cut the fluff".
---

# feel-shrink — token-aware doc compression

Finds token-saving edits for verbose docs without removing information.
The rule: compress the delivery, never the meaning.

Two modes:
- **Audit** (default) — flags patterns with specific locations and suggestions.
- **Apply** (`--apply`) — produces a revised full draft implementing all suggested
  cuts, for human review. Never overwrites the original.

---

## 1. Read the target doc

Open the file. Separate the FEEL head (the YAML block between the opening `---`
and closing `---`) from the body. Work on the body only — never touch the head.

Note the doc's `role` and `audience` from the head. These inform what patterns
are worth flagging: a `reference` doc can be more terse than a `guide` doc;
an end-user-audience doc must stay readable in its target language.

---

## 2. Measure current size

Don't recompute size by hand — read it from the shared counter, which already
applies the `head_count` thresholds and the `head_count_exempt` flag:

```bash
node tools/feel/health.mjs --sizes
```

Find the target doc's row for its char count, token estimate, and size flags.
(You still read the body in step 1 — that's for pattern-scanning, not counting.)

---

## 3. Scan for compression patterns

For each pattern below, identify every occurrence with its approximate line range
and a one-line suggestion. Group findings by pattern type.

**Pattern A — Redundant preamble**
Opening sentences that announce what the section will say before saying it.
> *"In this section we will discuss the checkout flow. The following explains
> how a user triggers a checkout..."*
→ Cut the announcement. Start with the substance.

**Pattern B — Heading restatement**
The first sentence of a section restates the heading in prose form.
> `## 3. Relation symmetry` followed by: *"Relation symmetry means that every
> source_of must have a matching derived_from..."*
→ The heading already said "relation symmetry." The sentence is repeating it.
Cut the sentence or fold its content into a tighter opening.

**Pattern C — Passive voice expansion**
Passive constructions that add words without adding meaning.
> *"This should be noted by the developer..."* → *"Note:"*
> *"It is important to ensure that..."* → *"Ensure:"*
Flag each instance; suggest the active-voice replacement.

**Pattern D — Example over-explanation**
An example followed by prose explaining what the example just showed.
> *"Example: `source_of: [user-guide]`. This means that user-guide is
> derived from this doc, which means this doc is the source..."*
→ The example is self-explanatory. Cut the trailing explanation.

**Pattern E — Duplicate statement**
The same rule or fact stated twice in the same section (or in two close sections)
with different wording. This is within-doc repetition.
→ Keep the tighter version; cut or cross-reference the other.

**Pattern F — Hedge stack**
Multiple softening phrases stacked on a single statement.
> *"You might want to consider possibly..."*
→ One hedge or none. Pick a position.

**Pattern G — List items that should be prose**
A bullet list of one-item sentences where a single sentence would be cleaner.
> `- The doc must have a head.` followed by `- The head must have an id.`
→ "The doc must have a head with an `id`." Two bullets → one sentence.

**Pattern H — Transition filler**
Sentences that do nothing but connect paragraphs.
> *"Now that we've covered X, let's look at Y."*
→ Cut. The heading or numbering already creates the structure.

---

## 4. Calculate compression potential

Count the total flagged instances by pattern. Estimate how many tokens would be
saved if all suggestions were applied (rough estimate: 30–80 tokens per flagged
instance depending on pattern type).

Report:
```
Compression potential
  Pattern A (preamble)       3 instances   ~90 t
  Pattern B (restatement)    5 instances   ~120 t
  Pattern C (passive)        8 instances   ~80 t
  Pattern D (over-explained) 2 instances   ~160 t
  Pattern E (duplicate)      1 instance    ~200 t
  Pattern G (list→prose)     4 instances   ~60 t
  Pattern H (filler)         6 instances   ~60 t
  ──────────────────────────────────────────────
  Total                      29 instances  ~770 t  (est. 19% reduction)
```

---

## 5. Print the audit report

List each finding with its line range and a specific suggestion. Keep it scannable:

```
feel-shrink audit — <doc-id>  (<today's date>)
Current size: ~N chars / ~N tokens

[B] line 34–35  Heading restatement
    "Relation symmetry means that every source_of..."
    → Remove. The heading §3 already names the concept.

[D] line 67–70  Example over-explanation
    "This means that user-guide is derived from..."
    → Remove trailing explanation; the YAML example is self-evident.

[E] line 88 + line 143  Duplicate statement — "symmetry is law"
    Nearly identical sentences in §4 and §6.
    → Keep the §4 version (more specific); replace §6 with a cross-ref.

... (all findings)

Compression potential: ~N tokens (~N% reduction)
Run /feel-shrink <id> --apply to see a revised draft.
```

---

## 6. Apply mode (`--apply`)

When `$ARGUMENTS` contains `--apply`:

1. Work through every flagged instance and apply the suggested cut.
2. Do not add new sentences or change meaning. Only remove or condense.
3. Output the revised doc body (not the full file — just the body) in a fenced
   code block for review.
4. Print a summary: "Applied N changes. Estimated reduction: ~N tokens (~N%)."
5. Explicitly state: "This is a draft. Review before replacing the original.
   Run `/feel-doc <id>` after replacing."

---

## Contract

**Requires**
- Target doc has a readable body (not empty after the FEEL head)
- `docs/feel.config.yaml` exists for threshold reference (degrades gracefully without it)

**Guarantees**
- No information is removed — only delivery is compressed
- Every finding cites a specific line range and a concrete suggestion
- Apply mode produces a draft for review, never overwrites the original
- Doc's FEEL head is never touched

**Never**
- Alters meaning, removes rules, or changes examples
- Writes to any file without `--apply` being explicitly passed
- Auto-applies changes without producing a draft for human review
- Suggests cutting localised text in end-user-audience docs (language choices
  in those docs are editorial, not compression targets)

---

## Argument

`$ARGUMENTS` — a FEEL doc id (e.g. `invariants`, `feel`) or a file path.
Append `--apply` to produce a revised draft instead of just the audit report.
If empty, ask which doc to shrink.
