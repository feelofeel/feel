# FEEL Examples

Real adoption patterns from projects running FEEL. These show *how* projects instantiate the framework — not the projects' domain content.

| Example | Project | Layer | Pattern highlights |
|---|---|---|---|
| [fefo-pattern.md](fefo-pattern.md) | FEFO (SORT app) | L3 + L4 | Multi-tenancy ceremony, Jira connector, release train, project skills, concurrent worktrees |
| [landing-pattern.md](landing-pattern.md) | SORT Landing | L3 | Minimal adoption, AGENTS.md bridge, static Astro project, no project skills yet |

## How to read these

Each example shows:
1. **What layer they stopped at** — and why that was the right call for their context
2. **What's in their `CLAUDE.md`** — the super-index shape for their project type
3. **What's in their `feel.config.yaml`** — audiences, doc registry, comparison groups
4. **What project-specific (`<project>-*`) skills they added** — or deferred
5. **Any novel pattern** worth borrowing

These are snapshots; the projects evolve. For the authoritative current state, read those repos directly.
