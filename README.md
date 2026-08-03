# FEEL — Documentation Operating System

**FEEL** is a lightweight framework that makes project documentation self-describing, relational, and cheap to navigate. Version control is preferred evidence when available; FEEL still works before git is connected or before the first commit.

Four pillars: **F**rontmatter first · **E**xplicit two-way relations · **E**volve with proportional ceremony · **L**ight by default.

---

## What you get

- Every doc opens with a variable-length YAML head — identity, version, relations, and optional reader metadata. Read through the closing `---`; never guess a line count.
- One super-index routes every task. Agents stop exploring; they navigate.
- Optional [Diátaxis](https://diataxis.fr/) metadata distinguishes tutorials, how-tos, reference, and explanation without replacing FEEL roles; its [complex-hierarchy model](https://diataxis.fr/complex-hierarchies/) allows audience-first routers instead of forcing four top-level folders.
- Proportional ceremony: safety work gets full guardrails, copy edits get none.
- Five portable skills (`feel-doc`, `feel-decision`, `feel-repeat`, `feel-session`, `feel-health`) keep the network honest.
- Capability-aware operation: git/history, changelogs, trackers, and roadmaps enrich FEEL but do not gate it.

## Adopt FEEL in a new project

**Current: copy-on-adopt** (npm package coming in Phase 2)

```bash
# 1. Copy framework files
cp -r feel/docs/conventions your-project/docs/
cp feel/.claude/commands/feel-*.md your-project/.claude/commands/
cp feel/templates/feel.config.yaml your-project/docs/
cp feel/templates/CLAUDE.md your-project/CLAUDE.md
cp feel/tools/feel/health.mjs your-project/tools/feel/health.mjs

# 2. Or use the installer
node feel/tools/install.mjs /path/to/your-project
```

Then:
1. Read [`docs/conventions/feel-adoption.md`](docs/conventions/feel-adoption.md) — decide how deep to go (L1–L4)
2. Fill `{{placeholders}}` in `CLAUDE.md` and `feel.config.yaml`
3. Run `/feel-doc` on every existing doc
4. Run `/feel-repeat` and `/feel-health` to validate

The installer and all core skills work in a directory with no `.git` folder or in
a git worktree with no commits. When history exists, skills prioritize it.

Full spec: [`docs/conventions/feel.md`](docs/conventions/feel.md)

---

## Repository layout

```
docs/conventions/   feel.md (spec) + feel-adoption.md (guide)
.claude/commands/   5 core skills (feel-doc, feel-decision, feel-repeat, feel-session, feel-health)
.claude/skills-archive/   9 extended skills (activate on demand)
templates/          CLAUDE.md skeleton, feel.config.yaml, decisions.md, docs-index.md
tools/              install.mjs bootstrap + feel/health.mjs deterministic counter
FEEL-EXAMPLES/      Real adoption patterns (FEFO + Landing)
foundation/         FEEL promise, principles, evidence, bench protocol
```

## Examples

- **[FEFO](FEEL-EXAMPLES/fefo-pattern.md)** — full L3+L4 adoption: multi-tenancy ceremony, Jira connector, release train
- **[SORT Landing](FEEL-EXAMPLES/landing-pattern.md)** — minimal L3 adoption: 4 docs, multi-agent AGENTS.md pattern, no project skills yet

## Versioning

Current: `feel_version: "1.5"`. Projects pin their copy via `.feel/feel.lock` and track drift via the `feel_version` header in their `docs/conventions/feel.md` copy. The npm pre-publish package remains `0.2.0`; package and framework-spec versions are separate clocks.

---

`feel_version: "1.5"` · `github.com/feelofeel/feel`
