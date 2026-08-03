---
title: FEEL Evidence Ledger
id: feel-evidence
role: log
status: living
doc_revision: 2
updated: 2026-08-03
source_of: []
derived_from: [feel-promise]
---

# Evidence ledger

Append-only. Only measured or directly observed facts; every entry names its claim ([promise.md](promise.md)), its method, and its bias caveat. Anecdotes are admissible if dated and specific — they hold `demonstrated n=1` at best, never `measured`.

| Date | Claim | Fact | Method | Caveat |
|---|---|---|---|---|
| 2026-06-10 | C4 | FEFO/SORT: multi-tenant SaaS at v1.28.1, live tenant, real frontline users, 29 applied migrations — built and operated by one person working primarily through an AI agent under FEEL. | Repo + prod inspection | Authored environment; founder discipline and model capability are entangled with the framework (n=1). |
| 2026-06-10 | C3 | 100 of ~200 FEFO commits since 2026-04-01 touch `docs/` — docs co-move with code rather than rotting. | `git log --since=2026-04-01 -- docs/` | Co-movement ≠ correctness; some share is head-bump ceremony overhead. |
| 2026-06-10 | C3 | Decision log holds steady at ~120 lines because prune-on-absorption actually runs — append-only logs normally only grow. | Line count + git history of `docs/history/decisions.md` | Single repo, single operator. |
| 2026-06-10 | C7* | 2026-06-10 consolidation archived 9 of 13 feel-* skills and merged architecture sub-docs — the system shed unused weight instead of accreting. (*supports principle 7 rather than a promise claim) | Git history; `feel/README.md` archive section | Self-pruning required operator initiative; not automatic. |
| 2026-06-10 | C1 | Anecdote: a cross-doc business question (pricing × competitors × infra cost) was answered from 3 targeted file reads, cold, with zero exploratory reads — routed by the super-index catalog. | Session observation | Single anecdote, authored repo, agent had project memory of the repo's layout. |
| 2026-08-03 | C1 | **Demonstrated n=1 (anecdotal):** Diátaxis labels plus decomposed audience routers improved targeted selection and reduced mixed-purpose body reads during a FEEL/SORT alignment session. The gain was partially defeated by fixed-line head reads, duplicated role/mode vocabulary, and FEEL version drift. Of 83 docs under SORT's `docs/`, 38 complete heads exceeded 15 lines; heads averaged 97 estimated tokens overall and 117.9 across 39 Diátaxis-tagged docs. | Direct session observation plus deterministic complete-frontmatter inventory before FEEL 1.5 alignment. | One authored repository, one agent, one session, and no control arm; this is not a comparative measurement. |

## What's still missing

- Any **controlled** comparison (C1, C2) — owned by [bench-protocol.md](bench-protocol.md).
- Adoption cost on a repo not built FEEL-first (C5) — falls out of the bench FEEL-ification step.
- Any data point from a repo Dee didn't author, or a user who isn't Dee.
