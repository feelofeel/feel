---
description: Maintain complete FEEL doc heads and relations after a meaningful doc change. Refreshes revision/date, optional stream and reader/publication metadata, relation symmetry, and the canonical super-index. Works with or without git, a publisher, a changelog, or a release train. Triggers on /feel-doc or any mention of "update the doc head", "add a doc", "new doc", "bump doc revision", "sync the guides", "fix doc relations", "classify this guide", "Diátaxis".
---

# FEEL doc workflow

Maintain metadata only for meaningful, action-changing doc work. Light copy edits
do not need head churn. Full convention: `docs/conventions/feel.md`.

## 1. Locate or create the doc

- Place the doc by `role`: product/rationale/reference under `docs/`; guides under
  `docs/guides/`; conventions under `docs/conventions/`; logs under `docs/history/`.
- Assign a unique stable kebab-case `id`. Moving or renaming the file never changes it.

## 2. Write or refresh the head

Read from the opening `---` through the closing `---`. Do not use a fixed line
limit. Preserve optional and project-specific keys you do not own; normalize or
remove one only when the governing config/spec requires it.

```yaml
---
title: <human title>
id: <stable-id>
role: index | spec | reference | convention | guide | rationale | log | plan | research
status: living | canonical | draft | working | plan | deprecated
doc_revision: <integer>
<optional stream field>: <current version>
updated: <YYYY-MM-DD>
source_of: [<ids>]
derived_from: [<ids>]
---
```

- New doc: `doc_revision: 1`.
- Meaningful change: increment `doc_revision` and set `updated` to today.
- Cosmetic change or adding the head itself: do not increment the revision.
- Refresh a stream field only when the project has an established release stream.
  Reuse the field already used by the network (`app_version`, `lib_version`, or a
  package-specific field) and read its value from the configured changelog or
  manifest. If no stream exists, omit it; never invent one for shape compliance.
- Add live-validation fields only when that environment was actually checked.
- A deprecated doc also sets `superseded_by: <id>`.
- Maintain `toc` for documents with four or more H2 sections. Use `head_lines`
  only when a post-YAML navigation summary exists; it counts the complete
  navigation zone, not a conventional frontmatter size.

### Optional reader and publication metadata

Read `vocabularies` and `publications` from `docs/feel.config.yaml` when present.
Do not invent a publisher, locale, or required field when the project has not
configured one.

- An internal practitioner article may declare one `diataxis` mode when it adds
  routing value beyond `role`. Specs, indexes, logs, plans, and research normally
  omit it.
- Classify with the compass: action + acquisition → `tutorial`; action +
  application → `how-to`; cognition + application → `reference`; cognition +
  acquisition → `explanation`.
- A configured `page_kind: article` carries exactly one primary mode when the
  publication contract requires it. A `page_kind: landing` routes several modes
  and must omit `diataxis` when the contract says so.
- If one article genuinely serves several modes, recommend decomposition or a
  landing page; do not pick an arbitrary label to silence validation.
- Run each matching publication contract's configured `validator` after edits.
  Never hard-code a host project's exporter or validation command into this skill.

## 3. Maintain relation symmetry

For every `source_of: [X]`, verify X lists this doc in `derived_from`. For every
`derived_from: [Y]`, verify Y lists this doc in `source_of`. Update both heads in
the same change. A dangling or one-way authoring relation is a bug.

## 4. Sync derived docs

When a source changes, update each affected derived body and head. Derived docs
inherit the source's stream stamp when one exists. Without a stream, compare and
refresh `doc_revision` and `updated` only.

## 5. Refresh navigation

Locate the canonical super-index from the `super-index` registry entry or the
`CLAUDE.md`/`AGENTS.md` pointer pair. Update only the canonical file; never maintain
two divergent maps.

On add/remove/rename/re-role, update:

1. The canonical super-index catalog.
2. The plain list in `docs/index.md` when present.
3. The `docs:` registry in `docs/feel.config.yaml` when present.

Keep catalog entries compact: id, role, read-when, and key relations. Versions stay
in heads.

## Contract

**Requires** a target doc or clear intent to create one, plus a canonical
super-index (`CLAUDE.md`, `AGENTS.md`, or the registered `super-index` path).

**Guarantees**
- Meaningful changes have current `doc_revision` and `updated` fields
- Stream stamps are refreshed only when backed by a declared version source
- Existing optional/project fields are preserved unless their contract changes
- Configured reader/publication metadata follows the declared vocabularies and validator
- Every authoring relation is symmetric
- Navigation and registry entries reflect structural doc changes

**Never**
- Edits code files or `docs/history/decisions.md`
- Invents a release stream, requires a changelog, or fails because git is absent
- Invents publication requirements or hard-codes a project validator
- Reads only a fixed line prefix instead of the complete YAML head
- Stamps an unverifiable stream version
- Bumps `doc_revision` for cosmetic changes
- Encodes environment versions into `doc_revision`

## Argument

`$ARGUMENTS` is a doc id, path, or short description. If empty, infer the target
from the current meaningful change. When behavior changed, update the authoritative
spec first and then its derived guides.
