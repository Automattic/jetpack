---
description: >
  Implement a premium-analytics task end-to-end: read the task spec from a local
  scratch md file (Phase 1 transition; Phase 2 will read the Linear issue directly —
  see "Input"), create a branch from `origin/trunk`, implement, build, run UI verification
  (default backend: wp-verify Playwright in jetpack-ai-sandbox; override via
  `VERIFY_SKILL` env var for non-sandbox backends), add a changelog entry, push, open
  a PR, start the review cycle, and audit for new invariants worth capturing into
  package docs.
allowed-tools: Bash(docker:*), Bash(node:*), Bash(npx:*), Bash(playwright:*), Bash(npm:*), Bash(pnpm:*), Bash(bash:*), Bash(curl:*), Bash(sleep:*), Bash(test:*), Bash(mkdir:*), Bash(cat:*), Bash(cp:*), Bash(tr:*), Bash(sed:*), Bash(grep:*), Bash(git symbolic-ref:*), Bash(git rev-parse:*), Bash(git fetch:*), Bash(git checkout:*), Bash(git add:*), Bash(git diff:*), Bash(git commit:*), Bash(git push:*), Bash(git remote:*), Bash(git rm:*), Bash(git log:*), Bash(git status:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr comment:*), Bash(gh pr edit:*), Bash(gh api:*), Bash(mktemp:*), Write, Read
---

# premium-analytics Implement Task

Implement a premium-analytics task from spec to an open PR with review cycle
started. The default verify backend (`/premium-analytics-verify-ui`) requires
`jetpack-ai-sandbox` with the Docker socket mounted; alternative backends supplied via
the `VERIFY_SKILL` env var (Step 4) carry their own environment requirements. Steps
unrelated to verify (git operations, build, changelog, PR creation, review cycle) run
the same way regardless of backend.

## Input

**Today (Phase 1 transition):** the skill takes a path to a local scratch
md file containing the task spec. The caller (human or upstream agent)
must save the Linear issue description to that file before invoking.
Every "task md" reference in the steps below points at this scratch
file.

```
/premium-analytics-implement-task /tmp/RSM-1234.md
```

The scratch file's contents must follow the **Linear issue contract**
documented in
`projects/packages/premium-analytics/AGENTS.md` → "Linear issue contract
for `/premium-analytics-implement-task`". That contract lists the
required sections (What, Scope, Implementation, DoD, Submitting) and
their expected structure. The scratch file is throwaway — `/tmp/` keeps
it out of the repo automatically.

A typical stopgap flow has two steps in two different surfaces — a
shell command to write the scratch file, then a slash-command inside
the Claude session.

**1. In a shell**, save the Linear issue description to the scratch
path. How you fetch the description is up to the caller — Linear web
UI copy/paste, MCP `linear/issue` tool, an Automattic CLI, etc.:

```bash
cat > /tmp/RSM-1234.md <<'EOF'
# Task: Add device-types pie chart to dashboard

## What
…

## Scope
…
EOF
```

**2. In the Claude session**, invoke the skill with the scratch path:

```text
/premium-analytics-implement-task /tmp/RSM-1234.md
```

**Future (Phase 2, RSM-3707, not yet landed):** the skill will take a
Linear issue identifier (e.g. `RSM-1234`) directly and fetch the
description via the `linear/issue` MCP tool — no scratch file needed.
The Linear issue contract referenced above is forward-compatible: when
Phase 2 lands, the same contract applies, the source just shifts from
the scratch file to the issue body in Linear.

## Pre-flight

Environment requirements depend on the chosen `VERIFY_SKILL` (Step 4) —
this skill does *not* enforce sandbox / Docker presence at the top level
any more, because non-sandbox backends are now first-class. The default
`/premium-analytics-verify-ui` runs its own pre-flight (Docker socket,
Playwright availability, etc.) when invoked; alternative verify skills
do the same for their own environments.

1. **Confirm `git`, `pnpm`, and `gh` are on PATH.** All three are
   required regardless of which verify backend runs:
   - `git` — branch / commit / push (every step touches git)
   - `pnpm` — Step 3 (build), Step 6 (changelogger)
   - `gh` — Step 8 (opens / updates the PR, posts the DoD verification
     comment when Step 5 produced `/tmp/dod-report.md` content)

   The sandbox image ships all three. Host setups usually have all three
   too. Install any missing tool before continuing.

2. **If running from the host (not inside `jetpack-ai-sandbox`),
   export `WP_BASE`** so the default `/premium-analytics-verify-ui`
   backend points its Playwright at the host-published port instead of
   the sandbox-internal `http://wordpress`:

   ```bash
   export WP_BASE="http://localhost:${WP_VERIFY_HOST_PORT:-8080}"
   ```

   Why this is needed: Step 4's default verify skill +
   regression-injection's default `VERIFY_COMMAND` both run
   `playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts`,
   and that config falls back to `http://wordpress` (the
   docker-network hostname only resolvable from inside the sandbox)
   when `WP_BASE` is unset. Inside the sandbox: leave `WP_BASE` unset.
   On the host: export it before invoking this skill, *not* inside
   one of the steps — Step 5's `/regression-injection` invocation
   needs to inherit it too.

   Skip this step if `VERIFY_SKILL` is overridden to a backend that
   doesn't use `WP_BASE` (e.g. jsdom unit tests, JN remote staging).

3. **Read the task md** and extract:
   - The branch name to create (from the Submitting section)
   - The changelog command
   - The scope (files allowed to touch)

## Step 1 — Resolve target branch

Read the branch name from the task md's Submitting section.

```bash
git fetch origin
CURRENT=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
if [ "$CURRENT" = "trunk" ] || [ -z "$CURRENT" ]; then
  # On trunk (or detached HEAD) — create the task's branch fresh from origin/trunk.
  git checkout -b <branch-name> origin/trunk
  TARGET_BRANCH=<branch-name>
else
  # Already on a feature branch — assume the caller wants to continue here
  # (e.g. bundling this task into an in-flight PR). Do not switch branches.
  echo "Continuing on existing branch: $CURRENT"
  TARGET_BRANCH=$CURRENT
fi
```

`TARGET_BRANCH` is the branch name to push and reference in later steps — it may
not equal `<branch-name>` from the task md when running in continue-on-branch mode.

The "continue on existing branch" mode is what lets a single PR bundle multiple
related changes — e.g. a docs commit on the same branch as the implementation.

## Step 2 — Implement

Follow the Implementation section of the task md exactly:
- Only touch files listed in the Scope section
- Use mock data as specified — do not fetch, do not invent endpoints
- Do not modify anything in `build/`

## Step 3 — Build

```bash
CI=true pnpm --filter='@automattic/jetpack-premium-analytics' build
```

Build must succeed before proceeding. If it fails, fix the error and re-run.

## Step 4 — UI verification

Invoke a verify skill. Slash commands are invoked directly — not via the shell —
so the resolution is a literal choice, not a bash interpolation:

- **If the `VERIFY_SKILL` env var is unset (default case):** invoke
  `/premium-analytics-verify-ui` (wp-verify Playwright running inside
  `jetpack-ai-sandbox`).
- **If `VERIFY_SKILL` is set:** invoke the slash command whose name matches
  the value. This is the extension point for non-sandbox backends —
  host-runnable wp-verify via port mapping, JN-style remote staging,
  jsdom unit tests, etc.

Before invoking, print the chosen skill so the run log is self-documenting:

```bash
echo "Verify skill: ${VERIFY_SKILL:-/premium-analytics-verify-ui}"
```

If verification fails, fix the root cause and re-run from Step 3. Do not proceed until
verification passes.

`VERIFY_SKILL` is a slash-command name — distinct from regression-injection's
`BUILD_COMMAND` / `VERIFY_COMMAND` (which are shell command strings). Two
different abstractions because the verify *skill* is a multi-step orchestrated
process (compose up, wait for wpcli, run playwright, screenshot, commit, …)
whereas regression-injection's `VERIFY_COMMAND` is a single executable invocation
of the test suite. Don't conflate them — a host-runnable verify backend is a
*different skill* (passed via `VERIFY_SKILL`); a different test-runner inside
the same orchestrated process is just a different `VERIFY_COMMAND` (handled
inside the verify skill or via regression-injection).

## Step 5 — Execute additional Agent-verifiable DoD items

**Setup — always run, even if no DoD items apply this cycle.** Truncate any leftover
DoD-report buffer from a previous interrupted run, so Step 8 doesn't post stale
content. `cp /dev/null` is a portable single-command truncate using `cp` (already in
the skill's allow-list):

```bash
cp /dev/null /tmp/dod-report.md
```

This setup runs unconditionally, before the skip decision below — so even when this
cycle has no Agent-verifiable items beyond build + UI verification, the buffer is
guaranteed empty and Step 8's non-empty check stays silent.

Re-read the task md's `Definition of done` section. If there are no Agent-verifiable
items beyond the base build + UI verification (already covered by Steps 3–4), skip
the rest of this step.

For each remaining Agent-verifiable item:

- **Regression-injection items** — invoke `/regression-injection <task-md-path>`.
  It handles the baseline-staging, injection, expected-failure check, revert,
  re-verification, and appends a structured outcome block to `/tmp/dod-report.md`.
  If `/regression-injection` reports cascade failure or non-green revert, treat
  the task as failed per HARD rules.

- **Other Agent-verifiable items** (deterministic CLI output, specific feature
  behavior assertion, etc.) — execute per task-specific instructions, then
  append your own outcome block to `/tmp/dod-report.md` using the same format
  the regression-injection skill uses:

  ```bash
  cat >> /tmp/dod-report.md << 'EOF'
  - **<one-line DoD item title from the task md>**: PASS
    - <one or more lines describing what was checked, expected, and observed>
  EOF
  ```

Do not commit `/tmp/dod-report.md` — `/tmp/` is outside the repo so this is
automatic.

## Step 6 — Changelog

Run the exact changelogger command from the task md's Submitting section:

```bash
pnpm jetpack changelogger add packages/premium-analytics \
  --significance=patch --type=added \
  --entry="<entry from task md>"
```

## Step 7 — Commit

Stage every scope-allowed file unconditionally — `git add` is idempotent, so files
already staged from Step 5's regression-injection pattern stay staged, and files
left unstaged by a non-regression DoD path (or by skipping Step 5 entirely) are
picked up. Then stage the changelog from Step 6 and commit:

```bash
git status                       # confirm no unstaged injection remains; verify the working tree matches Scope + changelog
git add <implementation-files>   # idempotent: stage anything in Scope not already in the index
git add <changelog-path>         # stage the changelog entry from Step 6
git commit -m "<conventional commit message>"
```

Do not stage or commit files outside the task's Scope section.

## Step 8 — Push and open or update PR

```bash
git push -u origin "$TARGET_BRANCH"
```

Use the `TARGET_BRANCH` captured in Step 1 — in continue-on-branch mode this may
differ from `<branch-name>` in the task md, and pushing the wrong ref will either fail
or publish stale work.

If no PR exists yet for this branch, open one targeting `trunk` using `/jetpack-pr`
(it derives the base repo from `gh repo view` defaults). If a PR is already open
(continue-on-branch mode from Step 1), the push updates it automatically —
afterwards, update the PR title/description to cover the new scope.

Fill or update the Agent Session Report section in the PR body:

```
## Agent Session Report
- Scope respected: yes / no
- Escalations triggered: N
- Contract violations: none / [describe]
- Human rework needed: none / minor / major
```

If Step 5 recorded any DoD outcomes (i.e. `/tmp/dod-report.md` is non-empty — the
setup in Step 5 truncates the file unconditionally, so a non-empty buffer is the
real signal that Step 5 ran items, distinct from "Step 5 was skipped this cycle"),
post them as a PR comment so reviewers can verify what was actually executed. The
post-revert filesystem state is identical whether Step 5 ran clean or was skipped,
so durable evidence is the only way to tell from the PR alone:

```bash
if [ -s /tmp/dod-report.md ]; then
  PR_NUM=$(gh pr view --json number -q .number)
  if {
    echo "## DoD verification"
    echo ""
    cat /tmp/dod-report.md
  } | gh pr comment "$PR_NUM" --body-file -; then
    # Only truncate after a successful post. `cp` is allow-list-friendly (no `rm` needed).
    cp /dev/null /tmp/dod-report.md
  else
    echo "ERROR: failed to post DoD verification comment for PR #$PR_NUM. Buffer preserved at /tmp/dod-report.md — retry the post or treat the task as failed per HARD rules; do not proceed to Step 9." >&2
    exit 1
  fi
fi
```

The truncate is gated on `gh pr comment` succeeding. If posting fails (auth /
network / PR doesn't exist / etc.), the buffer survives and the script exits
non-zero — required because the HARD rule below treats a missing `## DoD
verification` comment when Step 5 was in scope as task failure.

## Step 9 — Review cycle

Invoke the review-cycle skill manually right after Step 8 finishes:

```bash
/jetpack-pr-review-cycle <PR-number>
```

Keep the sandbox session alive (tmux recommended) so all rounds complete without
interruption.

## Step 10 — Invariant capture audit

Run after the review cycle has settled. Ask one self-audit question while the
agent's context is still warm with what surprised it during implementation and
review:

> Did this task surface anything the next agent doing similar work would want
> to know up front?

Concrete "yes" triggers (from past milestone tasks):

- A required prop / option that wasn't obvious from the type signature
  (e.g. `withTooltips` for hover acceptance tests — surfaced via PR #36 review)
- A workaround for a specific bug or lint interaction
  (e.g. inline `eslint-disable-line` surviving the pre-commit pipeline where
  the `next-line` form does not — also surfaced via PR #36 review)
- A load-bearing step in build / boot that future agents could mistakenly
  remove
  (e.g. the shim copy step in `build/modules/boot/index.min.asset.php`,
  already in `AGENTS.md` from the original codebase)

If the answer is **no** — most tasks — exit cleanly. Do not open an empty PR.

If the answer is **yes**, open a small follow-up PR that touches **only**
docs/contract files. Pick the destination based on the invariant's generality:

- `projects/packages/premium-analytics/AGENTS.md` — package-wide invariants
  (Phase 1/2 boundaries, "the shim copy step is load-bearing", etc.)
- `projects/packages/premium-analytics/docs/` — narrower or research-output
  content (a framework gotcha tied to a specific dep version, a 4-round
  review's findings on a single annotation, etc.)

Never bundle the invariant capture into the implementation PR — that PR is
already under review, and mixing in doc changes inflates scope and slows merge.
This is a separate PR.

```bash
# Anchor cwd and branch off the current trunk (not the implementation PR's
# branch — invariants should land on trunk independently of the implementation).
cd "$(git rev-parse --show-toplevel)"
git fetch origin
git checkout -b "docs/<invariant-topic>" origin/trunk
# Edit AGENTS.md / docs/ as needed, then:
pnpm jetpack changelogger add packages/premium-analytics \
  --significance=patch --type=changed \
  --entry="Docs: capture <invariant> learned during <RSM-XXXX> implementation."
git add <docs-files> changelog/
git commit -m "docs(premium-analytics): capture <invariant> from <RSM-XXXX>"
git push -u origin "docs/<invariant-topic>"
/jetpack-pr
```

Reference the originating implementation PR in the docs PR description so the
audit trail links both directions.

## HARD rules

- Never touch files outside the task's Scope section.
- Never invent endpoints, stores, or data contracts.
- Never edit files in `build/`.
- Never merge or close the PR — that is always the human's call.
- If any step fails, stop and report the error. Do not skip steps.
- If Step 5 ran (task md DoD has Agent-verifiable items beyond build + UI verification), the PR **must** contain a `## DoD verification` comment posted in Step 8. The post-revert filesystem state is identical whether Step 5 ran clean or was silently skipped, so this comment is the only durable evidence the verification mechanism actually fired. Missing comment when Step 5 was in scope = treat the task as failed.
- Step 10's invariant capture, when it produces output, is always a separate docs-only PR off `origin/trunk` — never bundled into the implementation PR or pushed onto the implementation branch. Bundling inflates the implementation PR's scope and slows merge.
