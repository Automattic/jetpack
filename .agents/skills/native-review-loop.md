---
description: Pre-push local review gate — spawn an independent reviewer subagent (via the Agent tool) to review the working diff, triage and fix valid findings, re-verify, and loop with a fresh reviewer until a clean pass, only then push. Use before pushing any branch, or when the user says "local review before push", "loop till clean", "native review".
allowed-tools: Agent, Read, Glob, Grep, Edit, Write, Bash
---

# Native Review Loop (pre-push gate)

## Overview

Get one or more independent local review passes on the **working-tree diff before it is pushed**.
Each pass is performed by a freshly spawned subagent that reviews from the diff and the repo's
own conventions — not from your prior analysis. You (the main agent) own triage, edits, and
verification. The loop repeats — fix, re-verify, re-review with a *new* reviewer — until a fresh
reviewer returns a clean pass (no blocker/should-fix findings) or the round bound is hit. Only
then do you push.

This is the inverse of a post-merge PR review: the gate runs **before** `git push`, so problems
never reach the remote or CI.

## Operating principles

- **Pre-push gate.** Do not `git push` until a review round comes back clean. If the bound is hit
  with unresolved blockers, stop and surface them to the user instead of pushing.
- **Reviewer independence.** Spawn each reviewer with fresh context. Never seed it with your
  conclusions, suspected bugs, planned fixes, or the "right answer." Give it only the diff scope,
  the base ref, and the public task brief / contract files to evaluate against.
- **Fresh reviewer each round.** After you fix findings, spawn a *new* reviewer rather than
  continuing the previous one — a clean pass only counts when an unprimed reviewer sees the fixed
  diff.
- **Ownership boundary.** The reviewer is read-only (inspect, run tests); it must not edit, stage,
  commit, or push. You make every edit.
- **Evidence over opinion.** Accept a finding only when grounded in the changed code, a repo
  convention/contract, a source of truth, or failing verification. Reject speculative or cosmetic
  churn.
- **Bounded.** Cap at ~3 rounds. Each round must only re-loop on blocker/should-fix findings;
  nice-to-haves are recorded as follow-ups, not loop fuel — otherwise reviewers nitpick forever.

## Workflow

1. **Snapshot and scope the diff.**
   - `git status --short --branch` and note the base ref this will push against (usually
     `origin/trunk`; use whatever the branch actually targets).
   - `git diff <base>...HEAD --stat` and confirm the diff is scoped to the intended work (no stray
     files, generated artifacts, unrelated refactors).
   - Identify the minimum verification set (tests, lint, typecheck, build) for the changed files.

2. **Round N — run one independent review pass.** Two ways to source the reviewer:
   - **`/ultrareview`** — if available in this environment (Claude for Enterprise), prefer it: it
     fans out multiple independent reviewers and adversarially verifies findings, which is a
     stronger gate than a single agent. Scope it to the working diff vs `<BASE_REF>`.
   - **Agent tool** (always available) — use `subagent_type: Explore` (read-only, fresh context —
     preferred) or `general-purpose` instructed not to modify files. Each Agent call starts fresh,
     which is what preserves independence.

   Either way, pass only the diff scope, base ref, and the contract/convention files the reviewer
   should judge against — never your findings. Reviewer prompt (for the Agent-tool path):

   ```text
   Independently review the uncommitted/unpushed changes in <REPO_PATH> on branch <HEAD> vs
   <BASE_REF>. Run `git diff <BASE_REF>...HEAD` to see the change. Judge it against the repo's
   own conventions (read <AGENTS.md / rule files / contract paths>) and the nearest existing code
   patterns. You may read files and run tests/lint, but do NOT edit, stage, commit, or push, and
   clean up any test artifacts. Review for correctness, contract/API alignment, backward
   compatibility, error/loading handling, security/privacy, performance, maintainability, test
   coverage, and consistency with local patterns. Return findings ordered by severity
   (blocker / should-fix / nice-to-have) with file:line, evidence, and why each matters. List the
   commands you ran and their results. If there are no blocker/should-fix findings, say
   "CLEAN PASS" explicitly and name the highest-risk area you inspected.
   ```

3. **Work while it runs.** Gather context to evaluate its feedback (source-of-truth checks, type
   flow, test coverage) on non-overlapping questions. Don't edit the tree if the reviewer shares
   the same checkout and the tool doesn't isolate it.

4. **Triage.** Classify each finding blocker / should-fix / nice-to-have. Accept only
   evidence-backed ones; reject speculation and cosmetic churn. Ask the user only when a valid fix
   would change scope, product behavior, or public API beyond the task's intent.

5. **Fix in the main workspace.** Minimal, pattern-consistent edits; update tests/fixtures/docs as
   the change requires. No AI attribution in commits/PR/comments/changelog.

6. **Re-verify.** Run the focused tests, lint/typecheck, and `git diff --check`. Re-review the full
   diff as if fresh: accidental broad refactors, API churn, unrelated/generated files.

7. **Loop or exit.**
   - If you fixed any blocker/should-fix, increment the round and go to step 2 with a **new**
     reviewer.
   - If the latest reviewer returned **CLEAN PASS** (or only nice-to-haves you've consciously
     deferred), exit the loop.
   - If the round bound is hit with unresolved blockers, **do not push** — report them to the user.

8. **Push.** Only after a clean pass: stage only related files, commit with a clean professional
   message, and push (`--force-with-lease` only after an intentional rebase). Then proceed with
   any draft-PR / CI steps the calling workflow defines.

## Final response

Report: rounds run, accepted findings per round and how each was fixed, findings rejected and why,
deferred follow-ups, final verification results, and the push status. If the loop exited on the
bound rather than a clean pass, say so and list what remains.
