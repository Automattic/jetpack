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
