#!/usr/bin/env bash
# Bootstrap a Jetpack worktree for /work-on.
#
# Creates a new worktree on branch `change/<slug>` branched off origin/trunk,
# runs pnpm install (frozen lockfile with a graceful fallback when the lock
# has drifted), seeds `.work-on/screenshots/`, and locally-ignores the
# `.work-on/` scratchpad. It does NOT isolate Docker and does NOT write env.json:
# the caller runs tools/docker/bin/seed-worktree-env.sh inside the new worktree,
# then records the instance name and ports it seeded into env.json.
#
# Usage:   bootstrap-worktree.sh <slug> [worktree-parent-dir]
# Output:  the worktree path on stdout
# Exit:    0 ok, 1 bad args, 3 target path already exists.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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
# Send git's progress chatter to stderr: this script's stdout contract is the worktree path
# alone, and callers capture it with $(...). Without this they get git's messages too.
git worktree add "$worktree" -b "$branch" origin/trunk >&2

(
	cd "$worktree"
	if ! pnpm install --frozen-lockfile --prefer-offline; then
		echo "Frozen-lockfile install failed (lockfile likely drifted); retrying without --frozen-lockfile." >&2
		pnpm install --prefer-offline
	fi
	mkdir -p .work-on/screenshots

	# In a linked worktree `.git` is a FILE (a gitdir pointer), so a literal `.git/info/exclude`
	# path fails with "Not a directory" — and under `set -e` that killed this script outright.
	# `git rev-parse --git-path` resolves to the real exclude file in every layout.
	exclude="$( git rev-parse --git-path info/exclude )"
	mkdir -p "$( dirname "$exclude" )"
	if ! grep -qxF '.work-on/' "$exclude" 2>/dev/null; then
		echo '.work-on/' >> "$exclude"
	fi

	# Seed the progress checkpoint here rather than leaving it to the caller: a worktree cannot
	# exist without this script having run, so a coordinator polling status.json can tell "the
	# worker never started" from "the worker started and went quiet". Non-fatal — a missing jq
	# should cost you the checkpoint, not the worktree you just built.
	if ! "$SCRIPT_DIR/checkpoint.sh" \
		--phase 3 --name "Worktree & Docker bring-up" --state running \
		--action "worktree created on $branch; docker not yet up" >/dev/null
	then
		echo "Warning: could not write .work-on/status.json (is jq installed?). Worktree is fine; checkpoint it manually." >&2
	fi
)

echo "$worktree"
