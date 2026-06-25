---
description: Produce a compact session-opening brief: last change, open Unreleased work, and the current planning pointer. Best at session start, not mid-session. Triggers on /feel-session or any mention of "orient me", "where were we", "session brief", "what should I work on", "catch me up", "session start", "what's open", "where did we leave off".
---

# feel-session — session-opening brief

Quickly re-orients a fresh session without loading the whole project.
It reads git, `CHANGELOG.md`, and the local planning pointer, then prints a brief under 20 lines.

---

## 1. Read recent git state

Run `git log --oneline -10` to see the last ten commits. Note the most recent
commit message and date. Run `git status` to check for uncommitted changes.

Summarise in one line: "Last commit: `<message>` (<date>). Uncommitted: yes/no."

---

## 2. Read the open unreleased work

Open `CHANGELOG.md`. Read the `## [Unreleased]` section. If it contains entries,
list them as a compact bullet summary (one line each). If it's `_Nothing yet._`,
note that too.

---

## 3. Read the planning pointer

Open `docs/roadmap.md` only as a local pointer/parking lot. Planning is moving to
Jira, so do not treat stale checklist items as authoritative. Summarise the
pointer in one line, or say "Planning: Jira / not in local docs" if no current
local horizon is clear.

---

## 4. Suggest a focus

Based on the above: if there's unreleased work that looks unfinished (only an
`[Unreleased]` entry but no commit closing it), suggest continuing it. If the
planning pointer names a specific task, mention it.

Keep the suggestion to one sentence. Don't prescribe — frame it as "the natural
next thing given where things are," not as an instruction.

---

## 5. Print the brief

```
Session brief — <today's date>

Last change    <one-line commit summary + date>
Uncommitted    <yes — N files modified / no>
In flight      <[Unreleased] bullets, or "nothing open">
Planning       <local pointer/Jira note, one line>

Suggested focus  →  <one-sentence recommendation>
```

Keep the total output under 20 lines. If any section is empty, omit it. The goal
is a fast re-orient — not a status report.

---

## Contract

**Requires**
- A git repository with at least one commit
- `CHANGELOG.md` with a `## [Unreleased]` section
- `docs/roadmap.md` exists as a local planning pointer

**Guarantees**
- Output is always ≤ 20 lines
- Suggestion is always framed as advisory, never imperative
- Only reads files — never modifies anything

**Never**
- Edits any file
- Runs other skills automatically
- Synthesises a full task plan (that's the user's call after reading the brief)
- Treats `docs/roadmap.md` as the authoritative backlog while planning is in Jira
- Reads the full roadmap, full changelog, or full git log (only the relevant slices)

---

## Argument

`$ARGUMENTS` — optional focus hint (e.g. `migration` or `frontend`). If provided,
bias the suggestion toward that area even if the git/planning state points elsewhere.
If empty, infer focus from the state data.
