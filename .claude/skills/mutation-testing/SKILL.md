---
name: mutation-testing
description: 🍋 Behavioral test-strength analysis of a change — mutate the changed source and check whether the suite actually fails. Surviving mutants mark tests that pass regardless of behavior. Advisory and diff-scoped; a declared `test:mutation` script selects the cheap scripted path, its absence the hand-probe path. Distinct from `test-gap-report` (structural — which files lack a spec) and `verify` (which just runs the suite).
origin: vendor
vendor_version: '0.10.0'
phase: post-implementation
invoked-by: [reviewer]
---

# Mutation Testing

The **behavioral** counterpart to [`test-gap-report`](.claude/skills/test-gap-report/SKILL.md)'s structural analysis. A structural
gap report asks "which changed files lack a dedicated spec?"; mutation testing asks the
harder question: **do the tests that exist actually fail when the code misbehaves?** It
mutates the source (flips `>` to `>=`, drops a line, swaps `&&`/`||`) and re-runs the
tests. A mutant that **survives** — the tests still pass on the broken code — marks a
test that asserts nothing load-bearing. Line coverage can't catch this; only mutation
can.

This skill is **advisory** and **diff-scoped**. It never rejects on its own (mutation
output is noisy — equivalent mutants are real and unavoidable), and it only mutates the
code the change touched, because mutating the whole tree per review is prohibitively
slow.

## Two paths, chosen at runtime

Check whether `package.json` declares a non-empty **`test:mutation`** script. That one
fact picks the path:

- **Declared** → the **scripted path**: one batch run of the project's own script,
  diff-scoped. The harness stays tool-agnostic — the script may drive Stryker or any
  mutation tool. Delegate to it exactly as [`verify`](.claude/skills/verify/SKILL.md) delegates to the project's declared
  scripts; never assume a specific tool's CLI.
- **Absent** → the **hand-probe path**: you mutate the source yourself, one composite
  trip per mutant, and revert every time.

The two paths do **not** apply equally, by design:

- The **scripted path runs on every review** where the script exists — it is a cheap
  batch, and its advisory output also catches weak tests in changes that declared no
  risk.
- The **hand-probe path is never a per-review mandate.** What you owe by hand is the
  Reviewer's evidence-ledger mutant floor (accounting for every changed non-test file
  under `declared-risk` — the Reviewer contract's Evidence-ledger section owns that
  rule; this skill never duplicates it), plus your own judgment when a survivor-shaped
  doubt is worth one probe. Probing beyond the floor is a judgment call, never a
  mandate.

## Scripted path: run the project's mutation script, scoped to the diff

Run the declared script focused on the **files this change modified** — not the whole
tree. How to scope depends on the project's tool; read its config and adapt:

- **Worked example (Stryker):** `node --run test:mutation -- --mutate "<changed files,comma-separated>"`,
  or rely on the tool's incremental mode (Stryker's `--since=<base>`) if the project
  configures one. The `--` forwards args to the underlying tool.
- If the tool offers no per-file scoping, run it as the project declares it and **note
  in your output that the run was un-scoped** (slower; don't silently imply diff-scope).

Capture the surviving mutants with their file + line.

## Hand-probe path: mutate, test, revert — one composite trip per mutant

Without a script, each probe is yours to run. The mechanics:

- **Choose mutants that would expose a weak test.** Target the load-bearing logic the
  change touched: flip a comparison (`>` ↔ `>=`), negate a guard, drop an early return,
  swap `&&`/`||`, delete a write. A good mutant is one a real assertion should kill; a
  cosmetic mutation (rename, whitespace) proves nothing.
- **How many is judgment, anchored by the floor.** What a review owes, and what counts
  as accounted-for, is the ledger contract's rule, not this skill's — the floor asks
  for accounting, never exhaustion. One or two well-aimed probes per logic-bearing
  file usually answer the question.
- **The round trip is one composite command whose revert is a trap, installed before
  the mutation.** Apply the mutation, run the focused test, and restore — in one
  shell invocation, never separate edit / test / revert calls, and never a revert
  that a red test or an interrupt can skip. The session can be stopped at any instant
  (Esc stops the running command with SIGTERM), and a mutant left behind reads as
  real work to whoever resumes. The `EXIT` trap restores on every way out — green,
  red, or interrupted:

  ```bash
  ( trap 'mv -f src/queue.ts.bak src/queue.ts 2>/dev/null' EXIT; \
    trap 'kill $! 2>/dev/null; exit 130' INT TERM HUP; \
    sed -i.bak '128s/>=/>/' src/queue.ts; \
    npx vitest run src/queue.spec.ts & wait $! )
  ```

  (Line-addressed on purpose — one targeted mutant per trip keeps the kill
  attributable; the `.bak` the in-place edit leaves is the revert. The subshell
  scopes the traps to the probe; the `INT TERM HUP` trap stops the runner and turns
  the signal into an ordinary exit so the `EXIT` trap runs. The test runs in the
  background under `wait` because a shell runs no trap while a foreground child is
  still running, and Claude Code follows Esc's SIGTERM with a SIGKILL within a
  second or two: `wait` returns on the signal, so the restore lands first. The
  `kill $!` matters for a Ctrl-C too — a background job in a non-interactive shell
  ignores SIGINT. Only a `SIGKILL` before the trap runs or a machine crash can
  still strand a mutant — `git status` after the
  trip shows the tree exactly as you found it, and a leftover `.bak` is the sign
  one was stranded.)

  A **killed** mutant (the focused test went red) is the good outcome; a **survivor**
  (still green on broken code) is the finding. Batching buys trips, never
  experiments — the probe set itself never shrinks to save calls.

- **Say so in your verdict — the nudge.** When this path ran, note in your verdict that
  the project can buy the cheaper batch: declaring a `test:mutation` script in
  `package.json` (driving Stryker or any mutation tool) activates the scripted path on
  the next review. The human reads it at the checkpoint, exactly while the artisanal
  cost is being paid. (Only when this path actually ran — never as a standing line.)

## Classify each surviving mutant — the two-case model (both paths)

A diff-scoped run mutates changed _files_, but a changed file still contains
**pre-existing, untouched lines**. Whichever path produced the survivor, where it
survives decides how you report it:

| Mutant survives on…                                      | Nature                                     | Channel                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| a line **this change added or modified**                 | a weak test **this task wrote**            | **verdict** — advisory finding; the Implementer _may_ strengthen it                                                 |
| a **pre-existing** line (the file was touched elsewhere) | an **independent**, pre-existing weak test | **[`note-side-finding`](.claude/skills/note-side-finding/SKILL.md)** → the Orchestrator offers a `/spinoff` capture |

Use the diff to decide which lines the change actually touched. When unsure whether a
mutated line is new or pre-existing, treat it as in-scope (verdict) — over-reporting in
the verdict is cheaper than mis-routing a real gap to a dismissable offer.

## Report

- **In-scope surviving mutants** → list them in your review verdict as an **advisory**
  block: file:line, the mutation that survived, and the assertion that would have
  caught it — all of them when few (over-reporting here is cheaper than mis-routing,
  per the two-case model). On a noisy run, carry the highest-value ones in the
  verdict and route the full list to the full-pass issue comment; on a per-step
  review — which posts no comment — anything worth keeping goes in the verdict
  bullets (the Orchestrator records those in `progress.md`); what you leave out dies
  with your context. This is **not** a REJECT on its own (decision: advisory). The
  Implementer may strengthen the tests; the Reviewer may still REJECT by _judgment_
  if a survivor exposes a genuinely dangerous untested path — but the mutation result
  alone never auto-blocks.
- **Pre-existing surviving mutants** → run **[`note-side-finding`](.claude/skills/note-side-finding/SKILL.md)**: one `## Side-findings`
  bullet each (file:line + the gap), then keep going. The Orchestrator collects it and
  offers the human a `/spinoff`. Don't fix it, don't reject on it — it isn't this task's.
- **Hand probes under declared risk also land in the ledger.** When the review's record
  carries `basis: declared-risk`, every probe you ran belongs in the sidecar's
  `mutants.files` entries per the Evidence-ledger section of the Reviewer contract —
  this skill points at that contract and never duplicates it.

If no mutant survives on the changed lines, say so in one line — a clean diff-scoped
mutation run is a meaningful positive signal about the new tests.

## Notes

- **Equivalent mutants** (a mutation that can't change observable behavior, so no test
  could kill it) are expected. Don't chase them; flag a survivor only when a real
  assertion would have caught it.
- Mutation testing is **slow** — keep it diff-scoped, and on the hand path run the
  focused spec, never the whole suite per mutant. If a single review's scripted run is
  blowing the time budget, report what completed and note the un-covered files rather
  than silently truncating.
