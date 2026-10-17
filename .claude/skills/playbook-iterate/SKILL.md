---
name: playbook-iterate
description: 🍋 Propose changes to a client playbook — or extract a new one from the codebase — when the spec collides with a documented pattern (a T6 PLAYBOOK_CONFLICT) or the client asks. Playbooks are client-owned; the Architect proposes and the human decides. Use when the Orchestrator routes a T6 discovery resolution to the Architect, or on an explicit "capture how we do X" request.
origin: vendor
vendor_version: '0.10.0'
invoked-by: [architect]
trigger-condition: a T6 PLAYBOOK_CONFLICT needs the playbook changed, or the client asks to extract/iterate one
---

# Playbook Iterate

## Core Principle

A **playbook** describes _how to build_ a category of software (a backend service, an
SPA, a testing strategy) in **project-agnostic** terms — placeholder names, never a real
codebase's symbols. Playbooks are **client-owned**: the vendor ships the
_format_ and the _lookup convention_, never the content. So this skill **proposes**; the
human **decides**. The Architect never rewrites a client playbook unilaterally.

## Where playbooks live (the lookup convention)

Two layers, discovered by convention `<topic>.md` — **no index** (an index drifts):

1. **Project-local** — `docs/playbooks/<topic>.md`. Harness-managed home, committed.
2. **User-global** — `~/.claude/playbooks/<topic>.md`. The developer's own generic playbooks.

(Both locations are configurable via `paths.playbooks` / `paths.playbooks_global`
in `harness.config.yml`; the defaults above apply when those keys are unset.)

Lookup is **local → global**, and the **local entry overrides** the global one for the
same topic. A missing playbook is not an error — degrade gracefully. New project-local
playbooks land in `docs/playbooks/`.

## Before any write — check the live decisions

Both modes start here. Search the ADRs still in force — every `docs/adr/NNNN-*.md` not
wholly `superseded` or `deprecated`; a _partially_ superseded ADR is live for the
points it does not name as superseded — and the other project-local playbooks for what
the change contradicts. If anything clashes, **stop before writing** and report each
clash — the document, the point, how they disagree. The human decides: supersede it,
keep it as a deliberate exception, or change this playbook change instead. Don't assume
the supersede: playbooks are generic and ADRs are this project's own, so an ADR that
departs from a playbook may be exactly the exception it records.

- **Supersede an ADR** → that is [`write-adr`](.claude/skills/write-adr/SKILL.md)'s outcome, never yours: a playbook
  describes _how_, it cannot be what an ADR is superseded _by_. Report it; the
  Orchestrator runs [`write-adr`](.claude/skills/write-adr/SKILL.md) first.
- **Another playbook** → propose its edit in the same diff.
- A project-local playbook overriding a global one for the same topic is the lookup
  convention working, not a clash.

When you are dispatched **with the human's decision** on a clash (it arrives in the
spawn prompt), that clash is settled: apply it instead of reporting it again. A
decision to supersede an ADR is settled only once that ADR's `Status` says
`superseded by` — if it does not yet, write nothing and report that the superseding
ADR comes first. Any other clash still stops you.

## Mode A — resolve a T6 PLAYBOOK_CONFLICT

The Orchestrator routes you here when a discovery resolution decided that honoring the
spec means the **playbook** should change (the playbook is the artifact being updated).

1. **Read both sides.** The playbook section in conflict and the spec requirement that
   collides with it. State the contradiction precisely.
2. **Propose the smallest change** that resolves it, framed as a diff to the playbook
   prose — and note the alternative (change the spec instead). The human already chose
   the direction during [`resolve-discovery`](.claude/skills/resolve-discovery/SKILL.md); you render that choice into the playbook.
3. **Edit the project-local playbook** (`docs/playbooks/<topic>.md`), keeping it
   project-agnostic — placeholder names, no symbols from this codebase. A rule that is
   really project-specific belongs in `CLAUDE.md` / an ADR / `CONTEXT.md`, **not** a
   playbook; say so if that's what the conflict actually reveals.
4. **Return** the updated playbook path and a one-line summary to the Orchestrator, so it
   can record the resolution and resume the paused sub-agent against the corrected source.

## Mode B — extract a playbook from the codebase (client-triggered)

On an explicit request ("capture how we do X here"):

1. **Find the pattern** in the code — the repeated shape, the convention the codebase
   already follows (use [`code-explorer`](.claude/skills/code-explorer/SKILL.md) first if the codebase is unfamiliar).
2. **Generalize it.** Strip the project's real names down to placeholders; describe the
   _pattern_, not the instance. If it can't be generalized, it's project-specific and
   doesn't belong in a playbook.
3. **Write** `docs/playbooks/<topic>.md` following the playbook conventions documented
   in `docs/playbooks/README.md` (project-agnostic, placeholder names), and report it for
   the human to review.

## Report

Return to the Orchestrator: the playbook path written/changed, a one-line summary, and —
for Mode A — confirmation it resolves the cited T6. If the change clashes with a live
decision, report each clash and that nothing was written yet. If the change turned out
to be project-specific (belongs in `CLAUDE.md`/ADR, not a playbook), report that instead
and make no playbook edit.

## Uncontemplated Scenarios

When a case doesn't clearly fit:

1. Apply the closest matching approach with reasoning.
2. **Flag it**: "This isn't covered by the playbook-iterate skill. I did [approach]
   because [reason]. Want to refine the skill?"
3. Offer to add a rule for the case.
