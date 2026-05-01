# Developing Jetpack CLI

## Setup

The jetpack-cli package is excluded from the pnpm workspace (`pnpm-workspace.yaml` has `'!projects/js-packages/jetpack-cli'`). It uses npm, not pnpm.

To develop locally:

```bash
cd projects/js-packages/jetpack-cli
npm install
npm link
```

This makes the global `jp` command use your local source. Changes to `bin/jp.js` take effect immediately (no rebuild needed).

Note: Running `bin/jp.js` directly won't work reliably — hooks and other tooling look for `jp` in `$PATH`.

## Architecture

The CLI delegates most commands to Docker via `tools/docker/bin/monorepo`. This ensures consistent Node, pnpm, and PHP versions regardless of what's installed on the host.

### Git hooks

Git hooks follow a three-stage delegation flow:

1. **Host hook** (`.git/hooks/<name>`, installed by `jp init-hooks`): Checks if we're already inside Docker via `$JETPACK_MONOREPO_ENV`. If not, delegates to `jp git-hook <name>`.
2. **CLI** (`jp git-hook <name>`): Invokes `tools/docker/bin/monorepo sh .husky/<name>` to run the hook inside Docker.
3. **Docker**: Runs `sh .husky/<name>` inside the container with the monorepo mounted at `/workspace`.

### Git worktrees

`initHooks` uses `git rev-parse --git-common-dir` to locate the hooks directory. In a regular checkout, this resolves to `.git/hooks/`; in a worktree it resolves to the main repository's `.git/hooks/`. This is correct because git hooks are shared across all worktrees.

#### Docker worktree support

Running hooks inside Docker from a worktree requires extra handling in `tools/docker/bin/monorepo`:

1. **Git mount** — A worktree's `.git` file contains a `gitdir:` pointer to a host path that doesn't exist inside the container. The script detects worktrees by comparing the normalized absolute paths of `--git-common-dir` and `--absolute-git-dir`, mounts the main repo's `.git/` at `/repo-git`, and sets `GIT_DIR`/`GIT_WORK_TREE` so git operations work.
2. **Shared Docker data** — Worktrees share the main repo's `tools/docker/data/monorepo` directory so SSH keys, composer cache, and pnpm store are reused.
3. **Auto-install** — When `node_modules/` is missing (e.g. fresh clone or new worktree), `pnpm install --frozen-lockfile` runs automatically before the requested command.
