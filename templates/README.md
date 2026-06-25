# FEEL Templates

Starter files for adopting FEEL in a new project. Copy and fill in `{{PLACEHOLDER}}` values.

| File | Purpose | Replace |
|---|---|---|
| `CLAUDE.md` | Super-index skeleton | All `{{}}` sections with project content |
| `feel.config.yaml` | Doc network config | PROJECT DATA section (`{{}}` values); keep FRAMEWORK SCHEMA |
| `decisions.md` | Empty decision log | `{{PROJECT}}` and `{{phase name}}` |
| `docs-index.md` | Public GitHub docs pointer | `{{PROJECT}}` |

## Quick start

1. Copy all four files into your project
2. Fill placeholders in `CLAUDE.md`: project name, one-line description, core value, change-type router rows, behavioral rules
3. Fill placeholders in `feel.config.yaml`: external tracker, audiences, doc registry
4. Copy `decisions.md` to `docs/history/decisions.md`; fill project name, remove the example row
5. Copy `docs-index.md` to `docs/index.md`
6. Run `/feel-doc` on every existing doc to give it a proper FEEL head
7. Run `/feel-repeat` to validate the network

See [`docs/conventions/feel-adoption.md`](../docs/conventions/feel-adoption.md) §2 for the full adoption walkthrough.
