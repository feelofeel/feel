# FEEL — Documentation Operating System

**FEEL** is a lightweight framework that makes project documentation self-describing, relational, and cheap to navigate. Git versions code; FEEL versions docs.

Four pillars: **F**rontmatter first · **E**xplicit two-way relations · **E**volve with proportional ceremony · **L**ight by default.

---

## What you get

- Every doc opens with a 10-line YAML head — identity, version, relations. You know what a doc is without reading it.
- One super-index routes every task. Agents stop exploring; they navigate.
- Proportional ceremony: safety work gets full guardrails, copy edits get none.
- Five portable skills (`feel-doc`, `feel-decision`, `feel-repeat`, `feel-session`, `feel-health`) keep the network honest.

## Adopt FEEL in a new project

**Current: copy-on-adopt** (npm package coming in Phase 2)

```bash
# 1. Copy framework files
cp -r feel/docs/conventions your-project/docs/
cp feel/.claude/commands/feel-*.md your-project/.claude/commands/
cp feel/templates/feel.config.yaml your-project/docs/
cp feel/templates/CLAUDE.md your-project/CLAUDE.md

# 2. Or use the installer
node feel/tools/install.mjs /path/to/your-project
```

Then:
1. Read [`docs/conventions/feel-adoption.md`](docs/conventions/feel-adoption.md) — decide how deep to go (L1–L4)
2. Fill `{{placeholders}}` in `CLAUDE.md` and `feel.config.yaml`
3. Run `/feel-doc` on every existing doc
4. Run `/feel-repeat` and `/feel-health` to validate

Full spec: [`docs/conventions/feel.md`](docs/conventions/feel.md)

---

## Repository layout

```
docs/conventions/   feel.md (spec) + feel-adoption.md (guide)
.claude/commands/   5 core skills (feel-doc, feel-decision, feel-repeat, feel-session, feel-health)
.claude/skills-archive/   9 extended skills (activate on demand)
templates/          CLAUDE.md skeleton, feel.config.yaml, decisions.md, docs-index.md
tools/              install.mjs bootstrap script
FEEL-EXAMPLES/      Real adoption patterns (FEFO + Landing)
foundation/         FEEL promise, principles, evidence, bench protocol
```

## Examples

- **[FEFO](FEEL-EXAMPLES/fefo-pattern.md)** — full L3+L4 adoption: multi-tenancy ceremony, Jira connector, release train
- **[SORT Landing](FEEL-EXAMPLES/landing-pattern.md)** — minimal L3 adoption: 4 docs, multi-agent AGENTS.md pattern, no project skills yet

## Versioning

Current: `feel_version: "1.1"`. Projects pin their copy via a `.fefo/feel.lock` (or equivalent) and track drift via the `feel_version` header in their `docs/conventions/feel.md` copy.

---

`feel_version: "1.1"` · `github.com/feelofeel/feel`
