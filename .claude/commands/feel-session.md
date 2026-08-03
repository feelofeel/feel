---
description: Produce a compact session-opening brief from the strongest local evidence available. Prefer git history and status when connected, but work without git, commits, a changelog, or a roadmap. Triggers on /feel-session or any mention of "orient me", "where were we", "session brief", "what should I work on", "catch me up", "session start", "what's open", "where did we leave off".
---

# feel-session — capability-aware session brief

Orient from the strongest evidence the project actually has. Version control is
high-priority evidence, not a prerequisite. Keep the result under 20 lines.

## 1. Detect available evidence

Check these capabilities without treating a missing one as an error:

1. **Version control:** Is git available? Is this a worktree? Does `HEAD` exist?
2. **Release stream:** Does `CHANGELOG.md` have an Unreleased section, or does a
   package manifest expose a current version?
3. **Planning:** Does `docs/feel.config.yaml` name an external tracker? Is there a
   `docs/roadmap.md`, another registered `role: plan` doc, or an obvious status doc?

## 2. Orient from version control when available

- **Git with history:** read at most the last 10 commits plus concise status. This
  is the primary source for the last change and uncommitted work.
- **Git worktree without commits:** read concise status including untracked files.
  Report "no commits yet"; do not fail.
- **No git/worktree:** inspect the current session's touched paths and a short list
  of recently modified project files, excluding dependency/build directories.
  Label the result "filesystem-only; no version history".

Never imply that filesystem timestamps prove authorship or intent.

## 3. Read release and planning pointers when present

- If `CHANGELOG.md` has `## [Unreleased]`, summarize only that section.
- Otherwise, report a package-manifest version if present; omit the release line
  when neither exists.
- Prefer a configured external tracker when `external_tracker.type` is not `none`.
  Otherwise read the smallest local planning/status pointer. If none exists, say
  "Planning: no source configured".

## 4. Suggest a focus

Use unfinished working-state evidence first, then the planning pointer. With no
history, frame the suggestion as tentative. Do not synthesize a full task plan.

## 5. Print the brief

```text
Session brief — <today>

Evidence       <git history | git/no commits | filesystem-only>
Last change    <commit summary, recent touched files, or "unknown without history">
Working state  <concise changed-file summary>
In flight      <Unreleased summary, package version, or omit>
Planning       <external/local pointer or "no source configured">

Suggested focus → <one tentative sentence>
```

Omit empty lines and keep the total at 20 lines or fewer.

## Contract

**Requires** read access to the project directory only.

**Guarantees**
- Uses git history and status as the primary evidence when they are available
- Degrades to filesystem/session evidence when git or commits are unavailable
- Labels evidence quality plainly and keeps output at 20 lines or fewer
- Treats changelog, package version, external tracker, and plan docs as optional

**Never**
- Fails solely because git, commits, `CHANGELOG.md`, or `docs/roadmap.md` is absent
- Edits files, initializes git, creates a commit, or connects an external tracker
- Presents filesystem timestamps as equivalent to version history
- Reads full logs, changelogs, or planning documents when a relevant slice exists

## Argument

`$ARGUMENTS` is an optional focus hint. If present, use it to choose among the
available evidence; if absent, infer the most plausible focus and label uncertainty.
