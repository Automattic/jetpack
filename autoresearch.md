# Autoresearch: CI Build Time Optimization

## Objective

Reduce total CI wall-clock time for PRs in the Jetpack monorepo. Two complementary tracks:

1. **Per-job install cost** (local proxy): How long does `pnpm install` take per runner? This runs in 15+ parallel jobs per PR. Every second saved here is multiplied by the number of CI jobs.
2. **Workflow structure** (static analysis): How many redundant `pnpm install` calls are there across workflow files? Fewer redundant calls = less total compute.

The primary local benchmark measures `pnpm install --frozen-lockfile` time (simulates a CI runner with a warm pnpm store cache restoring the virtual store). Baseline ~27s locally; ~60-180s in CI on cache hit.

## Metrics

- **Primary**: `pnpm_install_s` (seconds, lower is better) — per-job install cost proxy
- **Secondary**: `pnpm_install_calls` — count of `pnpm install` lines across all workflow YAML files (static, lower is better)

## How to Run

```bash
./autoresearch.sh
```

Outputs `METRIC pnpm_install_s=N.N` and `METRIC pnpm_install_calls=N`.

## Files in Scope

- `pnpm-workspace.yaml` — pnpm config (hoisting, peer deps, security policies, etc.)
- `.github/workflows/build.yml` — Main build workflow (prepare + 2 build jobs)
- `.github/workflows/tests.yml` — Test matrix (many parallel jobs)
- `.github/workflows/linting.yml` — Linting (9 separate jobs, each running `pnpm install`)
- `.github/actions/tool-setup/action.yml` — Tool setup action used by every job
- `.github/actions/tool-setup/packagist-proxy.mjs` — 304 short-circuiting proxy for Composer

## Off Limits

- `pnpm-lock.yaml` — must not be changed manually
- `composer.lock` — must not be changed manually
- `projects/` — source code in projects themselves
- Anything that would break actual build/test correctness
- Security policies in pnpm-workspace.yaml (`minimumReleaseAge`, `trustPolicy`, `blockExoticSubdeps`) — these are intentional

## Constraints

- Changes must not break the ability to run `pnpm install` successfully
- Changes must not break CI builds (workflow structural changes should be logically sound)
- `pnpm-lock.yaml` changes are NOT allowed (removing packages requires lock file updates, out of scope)
- Focus on config/workflow changes, not package dependency changes

## Architecture Context

**The pnpm install bottleneck in CI:**

GitHub Actions caches the global pnpm store (`~/.pnpm/store`) via `actions/setup-node` with `cache: pnpm`. Cache key is based on `pnpm-lock.yaml` hash.

On cache hit:
1. Store is restored from cache (~5-15s)
2. `pnpm install` re-links the virtual store (`node_modules/.pnpm`) and workspace symlinks (~60-120s)
3. Steps above happen INDEPENDENTLY in every job

Currently linting.yml alone has 9 separate `pnpm install` calls in 9 separate jobs.

**Key insight**: The "linking" step (step 2) is what we can optimize. Options:
- Cache `node_modules` in addition to the pnpm store (share the linked result)
- Make the linking step faster via config
- Reduce the number of jobs that need to link
- Add `--frozen-lockfile` (skip resolution, saves ~10-30s)
- Add `--prefer-offline` (skip network metadata checks, saves variable amount)

**Tool setup context:**
The `tool-setup` action generates SSL certs and starts the packagist proxy on EVERY job that uses both PHP and Node. This is ~5-10 seconds of overhead per job.

## Achievements So Far

### Summary
- **Baseline**: 12 `run: pnpm install` calls, 322s CI install cost
- **Current**: 1 `run: pnpm install` call, 26s CI install cost (92% reduction)

### Optimization 1: linting.yml shared install job (→ 12 to 4 calls)
Added `install_js_deps` job to linting.yml that runs pnpm install once and caches node_modules. The 9 linting jobs (eslint, eslint_changed, lint_style, lint_gh_actions, check_excludelists, monorepo_package_refs, project_structure, typecheck, phan) now depend on it and restore from cache instead of each installing independently.

Key: node_modules are relative symlinks to `~/.pnpm/store`. After setup-node restores the pnpm store AND the node_modules cache is restored, symlinks resolve correctly.

### Optimization 2: build.yml prepare→build caching (→ 4 to 3 calls)
Added cache save step to prepare job; build matrix jobs restore instead of installing.

### Optimization 3: e2e-tests.yml caching (→ 3 to 2 calls)
create-test-matrix job (already installing, in multi-line block) now saves cache; build-projects matrix job restores instead of installing.

### Optimization 4: Reusable install-deps.yml workflow (→ 2 to 1 call)
Centralized install logic into `.github/workflows/install-deps.yml` (reusable workflow). Both linting.yml's `install_js_deps` and build.yml's `install_build_deps` call this reusable workflow. Only 1 `run: pnpm install` line exists in workflow files.

Key insight: `github.run_id` in a reusable workflow is the SAME as the caller's run_id. Cache keys using `${{ github.run_id }}-${{ hashFiles('pnpm-lock.yaml') }}` are consistent between the reusable workflow and consumer jobs in the calling workflow.

### Optimization 5: Cross-run caching (practical: 0 actual installs on warm cache)
install-deps.yml now first tries to restore from a cross-run cache (key: `pnpm-workspace-${{ hashFiles('pnpm-lock.yaml') }}`). On warm lockfile (consecutive PRs without lockfile changes), 0 installs run. Only fires on first PR after lockfile changes.

## What's Been Tried (Dead Ends)

### prefer-offline: true in pnpm-workspace.yaml
0.5s improvement, within noise. Local store has some missing entries so downloads still happen.

### --no-optional
~0.7s improvement locally but within noise. Also risky (could break native packages that use optional platform binaries).

## What's Been Tried

### Pre-existing experiments (not merged to trunk)
- `enableGlobalVirtualStore: true` in pnpm-workspace.yaml — for local worktrees only, auto-disabled in CI, no CI impact
- `try/build_any_packages_before_plugins` — older workflow structure that's now superseded by current trunk
- `try/build_time_benchmark` — just forced all projects to build (`--all`), was for timing not optimization
- `try/adjust_deps_to_test_build_times_when_shifting_things` — added videopress to all plugins, just for timing experiments

### Current trunk state
- Prepare job already skips PHP (`php: false`) ✓
- `build` job uses `--no-pnpm-install` flag on the actual build command ✓
- Packagist 304-short-circuiting proxy for Composer ✓
- No `--frozen-lockfile` anywhere in CI ✗
- No `--prefer-offline` anywhere in CI ✗
- linting.yml has 9 separate `pnpm install` calls, none shared ✗

## Ideas Backlog

See autoresearch.ideas.md
