---
title: FEEL First Principles
id: feel-principles
role: rationale
status: draft
doc_revision: 1
updated: 2026-06-10
source_of: []
derived_from: []
---

# First principles

Why the mechanism should work. Eight ideas, one per line, each with its consequence. If a FEEL rule can't be traced to one of these, the rule is suspect.

1. **Agents read cold.** Every session starts with zero memory of the repo. → The repo must self-describe, or the agent re-derives it at full price, every time.
2. **Context is the unit of cost.** Tokens are the bill; attention is the budget. → Structure exists to shrink reads, not to look organized.
3. **Heads before bodies.** A doc's first ~12 lines answer *what is this, is it current, what's nearby*. → Identity is never discovered by reading prose.
4. **One map.** A single super-index routes every task; the catalog routes, the heads version. → Two maps disagree eventually; the agent can't tell which one lies.
5. **Relations live in data, declared both ways.** The doc graph is checkable, not implied. → Drift becomes a lint error instead of a surprise.
6. **Ceremony is proportional to risk.** Safety work gets full guardrails; polish gets none. → Process spent where it's cheap insurance, skipped where it's tax.
7. **Load-bearing or deleted.** A doc (or skill) that no task routes through is weight, not wealth. → The system must shed parts as readily as it grows them. (FEEL itself shipped 13 skills and kept 4.)
8. **A small true doc set beats a large stale one.** Trust is binary for an agent: one stale doc poisons the whole graph. → Truth maintenance outranks coverage, always.
