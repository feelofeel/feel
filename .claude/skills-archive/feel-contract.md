---
description: Audit skill contracts: requires / guarantees / never. Drafts missing contracts for review and can validate the current session against invoked skills' never-clauses. Never auto-edits. Triggers on /feel-contract or any mention of "skill contract", "what does this skill promise", "add a contract", "never clauses", "skill guarantees", "is this skill safe to chain", "audit skill contracts".
---

# feel-contract — skill contract checker

Checks whether command skills say what they require, guarantee, and never do.
Read-only unless the user separately asks to apply a drafted contract.

A skill contract is a three-clause declaration at the bottom of a skill file:

```markdown
## Contract

**Requires**
- preconditions that must be true for the skill to run correctly

**Guarantees**
- postconditions that will always be true after the skill runs

**Never**
- actions this skill will never take, regardless of what it's asked
```

Contracts make skills honest, chainable, and auditable. The `never` clauses are
the most important: they constrain what a skill *can* do in the hands of an AI
that might otherwise hallucinate an action.

---

## 1. Determine mode

Parse `$ARGUMENTS`:
- A skill name or path (e.g. `feel-doc`, `fefo-migration`) → **single-skill mode**
- `--all` → **full audit mode**: check every file in `.claude/commands/`
- `--session` → **session-validation mode**: read all current-session actions
  against the `never` clauses of every skill that was invoked this session
- Empty → ask which skill to check, or offer to run `--all`

---

## 2. Check for an existing contract

For each target skill file, read the file and look for a `## Contract` section
with `**Requires**`, `**Guarantees**`, and `**Never**` sub-blocks.

Report the status:
- `[✓ contract]` — all three clauses present
- `[⚠ partial]` — contract section exists but one or more clauses are missing
  or empty
- `[✗ no contract]` — no `## Contract` section

---

## 3. Generate a draft contract (if missing or partial)

For any skill with `[✗ no contract]` or `[⚠ partial]`:

Read the skill's numbered steps carefully. Derive:

**Requires** — what must exist or be true for the skill to work?
- Files it reads (does it fail gracefully if they're absent?)
- States it assumes (e.g. "a git repository with at least one commit")
- Other skills that must have already run

**Guarantees** — what will be true after the skill runs successfully?
- Files written or modified
- States that are now consistent (e.g. "source_of/derived_from symmetric")
- What the output contains

**Never** — what will this skill never do, even if instructed?
These are the most important to get right. Think about:
- Files this skill should not touch (code files? history/decisions.md?)
- Actions it should not take autonomously (bump versions? apply migrations?)
- Side effects it should never have (network calls? schema changes?)
- Actions that would be catastrophic if hallucinated

Format the draft as a proper `## Contract` block and present it for review.
Do not insert it into the file — present it in a code block with explicit
instruction: "Review this draft, then add it manually or ask me to add it."

---

## 4. Session-validation mode (`--session`)

When `--session` is passed, check whether any action taken in the current session
violates a `never` clause from an invoked skill.

Reconstruct the current session's actions:
- Which skills were invoked?
- What files were created or edited?
- What tools were called (Bash commands, MCP calls, etc.)?

For each invoked skill that has a contract, check its `never` clauses against
the session's actions. Flag any apparent violation:

```
[! possible violation]  feel-doc
  Never clause: "Never touches docs/history/decisions.md"
  Session action: decisions.md was edited in turn 4
  → Verify: was this edit from a direct user instruction (override) or
    from the skill running autonomously?
```

Note: violations are flagged as *possible* — the session validator can't always
distinguish a direct user override from an autonomous action. It's a prompt for
human review, not an accusation.

---

## 5. The contract format standard

Every skill in the FEEL family should have this section at the bottom, above
`## Argument`. The format is fixed:

```markdown
## Contract

**Requires**
- <precondition 1>
- <precondition 2>

**Guarantees**
- <postcondition 1>
- <postcondition 2>

**Never**
- <never-clause 1>
- <never-clause 2>
```

Rules for good `never` clauses:
- Be specific about the file or action, not vague: ✓ "Never edits `CHANGELOG.md`"  ✗ "Never makes changes"
- Cover the most catastrophic failure modes first: schema changes, data loss, publishing
- Include "without explicit user direction" when a constraint is overridable
- Three to six clauses is the right range — more is noise, fewer leaves gaps

---

## 6. Print the report

Single-skill mode:
```
Contract audit — feel-doc

Status     [✓ contract]

Requires   2 preconditions
Guarantees 3 postconditions
Never      4 clauses

Quality    Good. All clauses are specific and actionable.
           Suggestion: add a never-clause for "never edits code files"
           (it's implied but not explicit).
```

Full audit mode (`--all`):
```
Contract audit — all skills  (<today's date>)

Skill              Status           Quality
────────────────────────────────────────────────────
feel-doc           [✓ contract]     good
feel-decision      [✓ contract]     good
feel-repeat        [✓ contract]     good
feel-ghost         [✓ contract]     good
feel-health        [✓ contract]     good
feel-session       [✓ contract]     good
feel-trace         [✓ contract]     good
feel-shrink        [✓ contract]     good
feel-contract      [✓ contract]     good (meta)
feel-diff          [✗ no contract]  draft below ↓
fefo-summary       [✓ contract]     good
fefo-changelog     [⚠ partial]      missing never-clauses; draft below ↓
fefo-migration     [✓ contract]     good
fefo-poster-call   [✗ no contract]  draft below ↓
────────────────────────────────────────────────────
Coverage: N/N skills have full contracts

Drafts for missing contracts:
...
```

---

## Contract

**Requires**
- `.claude/commands/` directory with at least one skill file

**Guarantees**
- Every reported status has evidence (read the file, not assumed)
- Draft contracts are clearly labelled as drafts requiring review
- Session violations are reported as possible, not certain

**Never**
- Auto-inserts contract sections into any file
- Modifies skill files (read-only, always)
- Treats a `never` clause as a hard system constraint (they're honour-system
  commitments, not technical locks — violations are flagged, not prevented)

---

## Argument

`$ARGUMENTS` — a skill name (e.g. `feel-doc`), `--all` to audit every skill,
or `--session` to validate the current session against all invoked skills' contracts.
If empty, ask which skill to check or offer `--all`.
