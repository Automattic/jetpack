---
description: >
  Run a regression injection cycle against a caller-provided test backend — the
  injection edit lives in the local git working tree only (revert via git index;
  nothing is ever committed by the skill), but the build + verify backends themselves
  may be local or remote. Stage the implementation as a baseline, apply the deliberate
  edit described in the task md's DoD section, rebuild via $BUILD_COMMAND, run the
  suite via $VERIFY_COMMAND, confirm the expected spec fails (and only that spec),
  revert via the git index, and confirm the suite returns green. Append a structured
  outcome block to /tmp/dod-report.md. The skill is environment-agnostic: any backend
  (wp-verify Playwright, JN DOM check via rsync+curl, host-only jsdom, …) plugs in by
  setting the two env vars.
argument-hint: <task-md-path>
allowed-tools: Bash(npm:*), Bash(pnpm:*), Bash(playwright:*), Bash(test:*), Bash(cat:*), Bash(cp:*), Bash(bash:*), Bash(git add:*), Bash(git checkout:*), Bash(git diff:*), Bash(git rev-parse:*), Bash(git status:*), Read
---

# regression-injection

Run a single regression-injection cycle for a task md whose Definition of Done
contains a regression-injection acceptance item. Uses the git index as a baseline
snapshot so the revert only drops the injection — not the implementation.

This skill is invoked by `/premium-analytics-implement-task` Step 5, and can also be
invoked standalone to re-verify an existing implementation's regression coverage
(e.g. during dogfood / audit).

## Input

Path to a task md. The DoD section must contain a regression-injection acceptance
item describing:

- **Edit applied**: which string/value in which file changes to what
- **Expected failing spec**: which spec / assertion should fail
- **Revert + re-verify**: implicit — always required

The Scope section names the implementation files (used as the baseline-staging set).

## Configuration — `BUILD_COMMAND` and `VERIFY_COMMAND`

The skill itself is backend-agnostic. Two environment variables name the
caller's chosen toolchain:

| Var | Purpose |
| --- | --- |
| `BUILD_COMMAND` | Shell command that makes the changed code visible to the verify backend (e.g. `pnpm build` for a bundler-loaded package, `rsync ...` to deploy to a remote test host, no-op when the backend reads sources directly). |
| `VERIFY_COMMAND` | Shell command that runs the test suite which the injection should make fail. |

**Exit-code contract.** Both vars must exit non-zero on any internal failure —
not just `VERIFY_COMMAND`. A silently-failing `BUILD_COMMAND` would propagate
stale binaries into the verify step and produce misleading results (the
injection would appear to fail to reproduce because the verify never saw the
new code). The skill aborts the cycle as soon as either command exits non-zero.

Practical implications:
- Multi-step commands must use `&&` to propagate errors, not `;`. The skill
  invokes each var via `bash -o pipefail -c "$VAR"`, which catches the common
  pipeline-swallow case (e.g. the JN-style `curl ... | <DOM-extractor>`
  example: a curl/network failure now propagates instead of being masked by
  the extractor's exit 0 on empty input). But `;`-chained commands are *not*
  caught — the caller is responsible for `&&`-chaining anything where earlier
  failures must abort.
- Cleanup steps that should always run regardless of test outcome belong
  *outside* the var, in the caller's flow — not appended with `;`.

Both vars accept arbitrary shell command strings. `$(...)` substitutions,
env-var references, and pipes all expand at execution time inside the
spawned `bash -o pipefail` shell.

**Reference defaults** (the historical inner-loop wp-verify backend — applied
when the caller leaves the var unset *or* empty; see the `${VAR:=…}` lines in
Pre-flight below):

```bash
BUILD_COMMAND="CI=true pnpm --filter='@automattic/jetpack-premium-analytics' build"
VERIFY_COMMAND="NODE_PATH=\$(npm root -g) playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts"
```

The `\$` in `VERIFY_COMMAND`'s default is intentional — it escapes `$` so
the `$(npm root -g)` substitution defers to the spawned `bash -o pipefail`
subshell at execution time rather than running at default-assignment time.
Host and sandbox `npm root -g` return different paths, so deferring keeps
the substitution context-correct regardless of where the var got set.
Callers passing their own `VERIFY_COMMAND` for non-wp-verify backends
typically don't need this escape — only relevant when the substitution
must happen in a different shell from the one that sets the variable.

The wp-verify Playwright backend additionally requires a running wp-verify Docker
stack (mysql + wordpress + wpcli reachable from `http://wordpress`). Use it from
inside `jetpack-ai-sandbox` after `bash tools/ai-sandbox/wp-verify.sh up`.

**Other backends** the caller can plug in:

- **JN DOM check** (Symphony outer-loop style):
  `BUILD_COMMAND="rsync -a projects/packages/premium-analytics/build/ <jn-host>:/srv/.../premium-analytics/"`
  `VERIFY_COMMAND="curl -s https://<jn-host>/wp-admin/admin.php?page=jetpack-premium-analytics | <DOM-extractor>"`
- **Host-only Playwright** against an external WP staging URL:
  `BUILD_COMMAND="CI=true pnpm --filter=... build && rsync ..."`
  `VERIFY_COMMAND="playwright test tests/staging.spec.ts"`
- **jsdom unit test** (no WP runtime needed):
  `BUILD_COMMAND=":"` (no-op)
  `VERIFY_COMMAND="npx jest projects/packages/premium-analytics/__tests__/"`

**Permission model note.** Because the skill executes both vars via
`bash -o pipefail -c "$VAR"` and `allowed-tools` includes `Bash(bash:*)`, Claude Code's
per-binary permission gate does **not** apply to the contents of the
variables — whatever shell command the caller sets will run. The skill does
not validate or restrict the command's contents. The caller is responsible
for the security and correctness of the values they set; treat `BUILD_COMMAND`
and `VERIFY_COMMAND` as fully-trusted shell input.

## Pre-flight

```bash
# Anchor cwd at the repo root so later git/build/verify commands work
# regardless of where the caller (or an earlier diagnostic) left the shell.
cd "$(git rev-parse --show-toplevel)"

# Fall back to the wp-verify backend defaults documented in the Configuration
# section above when the caller leaves the var unset *or* empty. `${VAR:=…}`
# (the `:=` form) treats both states identically, so a deliberate empty
# value like `BUILD_COMMAND=""` also falls back — callers wanting a literal
# no-op should set `BUILD_COMMAND=":"` (the shell no-op).
#
# The `\$(npm root -g)` in VERIFY_COMMAND's default is intentional — the
# backslash escapes `$` so command substitution defers to the spawned
# `bash -o pipefail -c "$VERIFY_COMMAND"` (which runs inside the sandbox where
# `npm root -g` returns the correct global node_modules path). Without the
# backslash, $(npm root -g) would expand *here* at default-assignment time,
# pinning NODE_PATH to whatever shell ran wp-verify.sh — wrong if the host
# and sandbox npm prefixes differ (they do: host typically has a user-local
# prefix; sandbox uses /usr/local/lib/nodejs).
: "${BUILD_COMMAND:=CI=true pnpm --filter='@automattic/jetpack-premium-analytics' build}"
: "${VERIFY_COMMAND:=NODE_PATH=\$(npm root -g) playwright test --config tools/ai-sandbox/wp-verify/playwright.config.ts}"
```

The caller (usually `/premium-analytics-implement-task` Step 5) invokes this skill
*after* Steps 3 (build) and 4 (UI verification) have already established a green
baseline — so the working tree currently matches the implementation. This skill does
not re-run that initial verify.

## Step 1 — Stage implementation as baseline

Stage every file listed in the task md's Scope section that the implementation
touched:

```bash
git add <implementation-files>
```

This makes the index a "known good" snapshot. Step 5's `git checkout --` revert
restores from the index, dropping only the injection.

## Step 2 — Apply the injection

Apply the deliberate edit described in the task md's regression-injection acceptance
item. The edit must be scoped to files already in the task's Scope — never extend
reach beyond it.

After this, the injection should be the only unstaged change. Confirm:

```bash
git diff --name-only            # only the injected file(s) should appear
git diff --cached --name-only   # the implementation files
```

## Step 3 — Rebuild + verify

```bash
bash -o pipefail -c "$BUILD_COMMAND"
bash -o pipefail -c "$VERIFY_COMMAND"
```

Capture the verify command's output — Step 6 needs the failure-message excerpt.

## Step 4 — Confirm expected failure isolation

Two assertions:

1. The expected failing spec (named in the task md) fails.
2. **All other specs remain green.** Cascade failures indicate the injection was
   too broad and the suite is no longer testing what the task md claims it tests.

If isolation fails — stop. Do not revert yet. Report the discrepancy: which other
specs failed, what the cascade source likely is. Cascade is a real signal,
not noise — the spec graph shares state in ways the task md didn't anticipate,
and the human needs to redesign the injection.

## Step 5 — Revert + reconfirm green

Pass every injected path to `git checkout --` so the working tree is fully reset
from the index — Step 2 may have edited more than one file. Re-anchor cwd here
defensively in case an earlier diagnostic `cd`'d into a subdirectory; otherwise
the relative paths fail loud with `pathspec '<path>' did not match any file(s)
known to git` (exit 1) and require a retry from the correct directory.

```bash
cd "$(git rev-parse --show-toplevel)"
git checkout -- <injected-file>...   # one or more paths; restores from index, drops only the unstaged injection
bash -o pipefail -c "$BUILD_COMMAND"
bash -o pipefail -c "$VERIFY_COMMAND"
```

The suite must be green again. If not — stop. The index baseline was contaminated
(e.g. an extra unstaged change crept in). Do not commit; investigate.

## Step 6 — Record outcome to /tmp/dod-report.md

Append a structured block for the caller's evidence-persistence step:

```bash
cat >> /tmp/dod-report.md << 'EOF'
- **<one-line DoD item title from task md>**: PASS
  - Edit applied: <e.g. 'Desktop' → 'Workstation' in routes/dashboard/stage.tsx>
  - Expected failing spec: <spec-path:line and assertion>
  - Actual failure: <verify command's failure-message excerpt>
  - Other specs: green throughout
  - Revert + re-run: <verify command summary, e.g. 4 passed (0 skipped)>
  - Backend: <e.g. wp-verify Playwright; JN DOM; jsdom>
EOF
```

The caller (typically `/premium-analytics-implement-task` Step 8) reads this file
and posts it as the `## DoD verification` PR comment. Do not commit
`/tmp/dod-report.md` — `/tmp/` is outside the repo, automatic.

## HARD rules

- Cascade failure in Step 4 → stop and report. Do not auto-narrow the injection;
  the human needs to know the spec graph isn't as isolated as the task md claimed.
- Suite not green in Step 5 → stop. Do not commit. The baseline was contaminated.
- Never extend the injection outside the task's Scope section.
- Do not `cd` to subdirectories during the skill. Pre-flight anchors cwd at the
  repo root; if a diagnostic must inspect a subdir, use absolute paths or `ls
  /full/path` instead of `cd`. Subsequent steps assume cwd = repo root.
- The caller is responsible for invoking `cp /dev/null /tmp/dod-report.md` at the
  start of its own flow (so a previous interrupted run's buffer doesn't leak into
  this run). This skill only appends.
- The skill does not enforce environment prerequisites for the chosen backend
  (no `/.dockerenv` check, no socket probe). Backend errors surface from the
  `bash -o pipefail -c "$BUILD_COMMAND"` / `bash -o pipefail -c "$VERIFY_COMMAND"` calls themselves with
  their own messages.
