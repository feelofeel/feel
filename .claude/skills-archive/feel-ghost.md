---
description: Review deferred work, scope-boundary observations, and Claude Code tooling friction on request. Major safety/tooling deferrals may surface immediately; light deferrals stay quiet unless asked. Triggers on /feel-ghost or any mention of "what did you skip", "deferred items", "ghost queue", "what else did you notice", "session deferred list", "carry items forward", "tooling friction", "what was blocked".
---

# feel-ghost — in-session deferred queue

Reviews deferred items on request; major safety/tooling issues may surface sooner.
FEEL is light by default: small light-ceremony deferrals do not need a response
footer, while safety-relevant deferrals and tooling friction still deserve visibility.

There are two ways this skill operates:

- **Passive** — major safety/tooling items can be surfaced immediately according
  to `docs/feel.config.yaml`; routine light deferrals stay quiet.
- **Active** — invoke `/feel-ghost` to review the full queue, act on items, or
  carry the most important ones to the next session.

---

## Ghost item types

Every ghost entry has a type that controls how it's displayed and whether it
auto-spawns as a sidebar task chip:

| Type | Meaning | Default spawn |
|---|---|---|
| **[A] deferred work** | Safety/normal ceremony work that should have happened but did not — a skill not run, a test not updated, a head not bumped | no |
| **[B] scope boundary** | Noticed something real but outside current task scope — a bug in adjacent code, a doc gap, a planning item pulled on me | no |
| **[C] uncertainty** | Would have done X but wasn't sure it was wanted — a refactor that felt risky, an ambiguous requirement | no |
| **[D] tooling friction** | Claude Code blocked an action and a workaround was used — permission rule missing, classifier denial, settings gap; includes the suggested fix | yes (chip) |

---

## The passive ghost block (emitted by Claude, not invoked)

When `ghost_visibility: always` and the ghost queue is non-empty, Claude may append
this block at the bottom of a response — after the main work, before any summary.
A project's default is often lighter (`on-request` + `major`), so this full footer is not
routine:

```
──────────────────────────────────────────────
👻  Noticed but deferred
    [A] feel-doc not run on architecture.md — head is now stale
    [A] Test gap: new edge case in <function> not covered
    [B] roadmap §post-MVP: feature X mentioned; not this task
    [D] git add blocked by classifier → used workaround; fix: add Bash(git add*) to .claude/settings.local.json
──────────────────────────────────────────────
```

When `ghost_visibility: on-request`, do not print the full block by default. If a
major safety/tooling item exists, print a compact inline count:
`👻 3 items deferred — /feel-ghost to review`.

When `ghost_visibility: off`, nothing appears.

**The block is suppressed when:**
- The queue is empty
- The response is itself a ghost-management response (no recursion)
- The item was already emitted in a previous turn this session

---

## Active mode — what `/feel-ghost` does

When the user explicitly invokes `/feel-ghost`:

### Step 1 — Recall the queue

Reconstruct the full ghost queue for this session: all [A], [B], [C] items that
were emitted in 👻 blocks or accumulated but not yet surfaced. Include the turn
where each item was deferred and a one-line reason.

### Step 2 — Format the full queue

Print a numbered list, grouped by type:

```
Session ghost queue — <count> items

Deferred work [A]
  1. feel-doc on architecture.md (turn 3 — head stale after §2.4 edit)
  2. Test gap in resolveWriteOffQuantity edge case (turn 3)
  3. feel-repeat --diff not run after doc edits (turn 5)

Scope boundaries [B]
  4. roadmap §post-MVP: consumption-tracking opt-out — noticed, not addressed
  5. Minor: <file> has a dead branch in a handler — not the task

Uncertainties [C]
  6. <module>: the idempotency check could be tightened — wasn't sure
     if you wanted that touched here
```

### Step 3 — Offer four actions

For each item (or "all [A]", "all [B]"), offer:

- **Do it now** — address the item inline in this response. For [A] items that
  are just skill invocations (feel-doc, the changelog skill), run them immediately.
- **Promote** — create a `spawn_task` chip so the item lives as a visible sidebar
  task. Good for [B] items or anything that needs a fresh session.
- **Dismiss** — acknowledge the item as "won't do / not needed" and remove it
  from the queue.
- **Carry** — save to `.claude/ghost-carry.md` so `feel-session` surfaces it at
  the next session start.

Do not take any action until the user specifies. List options, wait for direction.

### Step 4 — Execute chosen actions

For **Do it now**: run the skill or make the change inline.

For **Promote**: call the `spawn_task` tool with the item text as the prompt and
a clear title. Confirm the chip was created.

For **Dismiss**: acknowledge the dismissal in one line. Remove from queue.

For **Carry**: append the item(s) to `.claude/ghost-carry.md` in this format:
```
# Ghost carry — carried from session <today's date>

- [ ] [A] feel-doc on architecture.md — head stale after §2.4 edit
- [ ] [B] lib/push.js dead branch in shift-end handler — investigate
```
If the file doesn't exist, create it. If it exists, append a new dated block.

---

## What counts as a ghost-worthy deferral

**Ghost-worthy in safety/normal ceremony:**
- A skill that *should* have run but didn't (feel-doc after a meaningful doc
  change, the changelog skill after behaviour changed, feel-repeat after risky
  doc restructuring)
- A broken invariant noticed in adjacent code
- A test that should exist but doesn't
- A FEEL head that became stale

**Ghost as [B] scope boundary:**
- Anything the current planning source marks as out of scope that the task touched
- A bug in code outside the current task's file scope
- A doc gap in a doc not being edited this session

**Ghost as [C] uncertainty:**
- A refactor that would improve quality but might conflict with unstated intent
- An ambiguous acceptance criterion in the feature spec
- A decision that felt architectural and needed the owner's input

**Ghost as [D] tooling friction — always chip:**
- Any Bash/tool call that was denied by the Claude Code classifier and required a workaround
- A settings permission that should exist but doesn't (`Bash(git add*)`, `Bash(node *)`, etc.)
- An MCP tool that failed or wasn't reachable when it should have been
- A Write/Edit blocked on a config file that the user would need to apply manually

Format for [D] items:
```
[D] <what was blocked> → <workaround used>
    Fix: <exact change — e.g. add Bash(git add*) to .claude/settings.local.json>
```

[D] items always spawn a chip immediately (don't wait for `/feel-ghost`). The chip
title should be the fix, not the symptom, so the user can act on it directly.

**Never ghost:**
- Cosmetic observations with no action attached
- Light-ceremony deferrals with no safety or behaviour impact
- Things already tracked as spawn_task chips this session
- CHANGELOG and feel-doc runs that were already completed

---

## Contract

**Requires**
- `docs/feel.config.yaml` exists with a `session` block (for visibility settings)
- A running session with at least one prior turn

**Guarantees**
- Major safety/tooling deferrals are surfaced honestly; routine light deferrals wait for `/feel-ghost`
- Actions taken only on explicit user request (passive block = inform only)
- Carry file (`.claude/ghost-carry.md`) only written when user chooses "carry"

**Never**
- Auto-runs other skills without user direction
- Edits any doc file in passive mode
- Creates spawn_task chips for [A] or [C] items without being asked
- Creates spawn_task chips for [D] items without including the exact suggested fix
- Persists ghost state anywhere except `.claude/ghost-carry.md` when explicitly requested

---

## Argument

`$ARGUMENTS` — optional action hint:
- Empty → show full queue and offer actions
- `promote [n]` → promote item n to a spawn_task chip
- `carry` → save all unresolved items to `.claude/ghost-carry.md`
- `dismiss all` → clear the queue with a one-line acknowledgement per item
