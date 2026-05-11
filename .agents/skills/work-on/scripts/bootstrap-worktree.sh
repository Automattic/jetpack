#!/usr/bin/env bash
# Bootstrap a Jetpack worktree for /work-on.
#
# Creates a new worktree on branch `change/<slug>` branched off origin/trunk,
# runs pnpm install (frozen lockfile with a graceful fallback when the lock
# has drifted), seeds `.work-on/screenshots/`, and locally-ignores the
# `.work-on/` scratchpad. It does NOT write env.json — that belongs to the
# caller, which knows which ports were allocated.
#
# Usage:   bootstrap-worktree.sh <slug> [worktree-parent-dir]
# Output:  the worktree path on stdout
# Exit:    0 ok, 1 bad args, 3 target path already exists.

set -euo pipefail

if [[ $# -lt 1 ]]; then
	echo "Usage: $0 <slug> [worktree-parent-dir]" >&2
	exit 1
fi

slug="$1"
parent="${2:-$(dirname "$(pwd)")}"
worktree="$parent/jetpack-$slug"
branch="change/$slug"

if [[ -e "$worktree" ]]; then
	echo "Path already exists: $worktree" >&2
	exit 3
fi

git fetch origin trunk --quiet
git worktree add "$worktree" -b "$branch" origin/trunk

(
	cd "$worktree"
	if ! pnpm install --frozen-lockfile --prefer-offline; then
		echo "Frozen-lockfile install failed (lockfile likely drifted); retrying without --frozen-lockfile." >&2
		pnpm install --prefer-offline
	fi
	mkdir -p .work-on/screenshots
	if ! grep -qxF '.work-on/' .git/info/exclude 2>/dev/null; then
		echo '.work-on/' >> .git/info/exclude
	fi
)

echo "$worktree"
