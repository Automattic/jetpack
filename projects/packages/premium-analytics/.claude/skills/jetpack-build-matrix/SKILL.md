---
name: jetpack-build-matrix
description: >
  Build the four-layer matrix (foundations + feature package + feature plugin) before any
  end-to-end / browser / screenshot test of a Jetpack feature. `jp build <project> --deps`
  alone is NOT sufficient for E2E — see "Why" below. Also documents `jp watch <project>` for
  active development. Use when about to test a feature in a live WP env, when the user says
  "build for testing", "rebuild Search", "the admin looks broken after checkout",
  "/jetpack-build-matrix", or before invoking the `jetpack-screenshot` / `jetpack-screenshot-local`
  skills. Args: <feature> (e.g. search, social, boost, protect) and optional sub-command
  (full | watch | fallback).
allowed-tools: Bash(jp build:*), Bash(jp watch:*), Bash(pnpm jetpack:*), Bash(pnpm:*), Bash(ls:*), Bash(git rev-parse:*), Bash(git status:*), Bash(date:*), Bash(test:*), Read
---

# Jetpack Build Matrix

Before any end-to-end test of a feature in project `<X>` — screenshots, browser interaction, integration tests against a live WP env — build the **full four-layer matrix** from the monorepo root:

```bash
pnpm jetpack build packages/my-jetpack   # foundational (always)
pnpm jetpack build plugins/jetpack       # foundational (always)
pnpm jetpack build packages/<X>          # the feature's package
pnpm jetpack build plugins/<X>           # the feature's plugin (skip if no plugin by that name exists)
```

Equivalent shorthand (uses the `jp` wrapper inside the monorepo Docker container):

```bash
jp build packages/my-jetpack
jp build plugins/jetpack
jp build packages/<X>
jp build plugins/<X>
```

## Concrete examples

**Search 3.0:**
```bash
jp build packages/my-jetpack
jp build plugins/jetpack
jp build packages/search
jp build plugins/search
```

**Boost:**
```bash
jp build packages/my-jetpack
jp build plugins/jetpack
jp build packages/boost-core      # boost's package family
jp build plugins/boost
```

**Protect:**
```bash
jp build packages/my-jetpack
jp build plugins/jetpack
jp build packages/protect-status
jp build plugins/protect
```

If you're unsure which package(s) belong to a feature: `ls projects/packages/ | grep -i <X>` — multiple packages may apply. Build each.

## Why the matrix

`my-jetpack` and `plugins/jetpack` are shared by **every** Jetpack project at runtime — admin menu, connection UI, module loader, runtime constants. Without them built, even a correctly-built feature plugin fails to boot inside WP. The feature's own package holds the business logic; its plugin wires that logic into WP (REST endpoints, blocks, assets). All four layers must be aligned.

`--deps` alone does **not** reliably reach every upstream dependency in this monorepo — being explicit is what's proven to produce a working admin + frontend. (For pure-PHP or pure-unit-test work that doesn't hit a running WP env, `jp build <project> --deps` remains fine.)

## Sub-commands

### `full` (default)
Run the four-layer build for `<feature>` as shown above. Exit non-zero on any individual build failure — don't continue past a broken layer.

### `watch`
For active development, after the matrix has been built once:

```bash
jp watch <project>              # rebuild on file changes
```

Watch one project per terminal. Common patterns during a feature edit:
- One `jp watch packages/<X>` for business-logic edits.
- One `jp watch plugins/<X>` for endpoint / block / asset edits.

`jp watch` does **not** replace the matrix on a fresh checkout — run `full` first, then `watch` for incremental work.

### `fallback`
Last-resort full-monorepo build when the matrix still produces a broken admin / frontend (missing assets, stale modules, cross-project dep weirdness):

```bash
pnpm jetpack build --all
```

Slow (builds every package and every plugin) but guarantees a coherent workspace. Don't default to this — only after the targeted matrix has been tried.

## Rebuild triggers

You **must** re-run the matrix after:
- Switching branches between `trunk` and a feature branch (screenshots-before / screenshots-after flows).
- `git pull` or rebase that touches files under `projects/packages/my-jetpack/`, `projects/plugins/jetpack/`, or the feature's own project.
- Any `composer install` / `pnpm install` in any of those four projects.

Stale builds are the #1 cause of "the admin looks broken / module is missing / blocks don't render" symptoms in the per-agent docker envs.

## Output

```
FEATURE: <X>
LAYERS_BUILT: my-jetpack, plugins/jetpack, packages/<X>, plugins/<X>   # or fewer if some don't exist
BUILD_STATUS: ok | failed
FAILED_LAYER: <layer name>   # only when BUILD_STATUS=failed
```
