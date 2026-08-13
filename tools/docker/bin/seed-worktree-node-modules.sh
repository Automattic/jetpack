#!/usr/bin/env bash

# seed-worktree-node-modules.sh — give a fresh git worktree a near-instant node_modules by cloning
# it from an already-installed checkout, instead of paying for a full `pnpm install` over Docker's
# (slow, on macOS) bind mount.
#
# Why this is safe and correct:
#   - This monorepo forbids from-source native builds (pnpm-workspace.yaml: `strictDepBuilds: true`
#     with every `allowBuilds` entry `false`). So node_modules is a pure function of the committed
#     lockfile and the target os/cpu/libc — never of the Node ABI. A tree installed in one checkout
#     is byte-for-byte valid in another on the same platform.
#   - pnpm's layout is relocatable: node_modules/.pnpm holds relative symlinks plus hardlinks into
#     the shared, content-addressed store (mirror-mounted at a stable path in every worktree). Copy
#     the tree to a new checkout path and the relative links stay valid and the store references
#     still resolve.
#   - This script only SEEDS the tree. It does not make it authoritative: run `jp install` afterward
#     and pnpm reconciles in-container against this worktree's own lockfile (a no-op when the
#     lockfiles match, a small diff when they don't). That in-container reconcile is what guarantees
#     the result matches the box, so a stale or slightly-divergent seed can never ship a wrong tree.
#
# On APFS the copy is a clonefile(2) (`cp -c`): copy-on-write, so it is near-instant and adds
# almost no disk until a file diverges. On other filesystems it falls back to a plain recursive
# copy — correct, just not free.
#
# Like seed-worktree-env.sh, this is:
#   - host-only (run it on your machine, not inside the container — it clones host files),
#   - idempotent (a no-op if this worktree already has a root node_modules), and
#   - a no-op in the primary checkout (nothing to seed into; it is usually the source).
#
# Written for the bash 3.2 that ships with macOS.
#
# Usage:  tools/docker/bin/seed-worktree-node-modules.sh [source-checkout]
#
#   source-checkout  Optional path to an installed checkout to clone from. Defaults to the main
#                    working tree that backs this worktree (the primary checkout).

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MONOREPO_ROOT="$( cd "$SCRIPT_DIR/../../.." && pwd )"

# Anchor git lookups to this worktree (the one that owns this script), not the caller's cwd.
cd "$MONOREPO_ROOT"

# Detect a *linked* worktree: its per-worktree git dir differs from the shared common dir. In the
# primary checkout the two are equal — there is nothing to seed into, so leave it alone. Resolve
# both with `pwd -P` so reaching a checkout through a symlinked path doesn't make them differ.
GIT_ABS_DIR="$( cd "$( git rev-parse --absolute-git-dir 2>/dev/null || echo . )" 2>/dev/null && pwd -P || true )"
GIT_COMMON_DIR="$( cd "$( git rev-parse --git-common-dir 2>/dev/null || echo . )" 2>/dev/null && pwd -P || true )"
if [ -z "$GIT_ABS_DIR" ] || [ "$GIT_ABS_DIR" = "$GIT_COMMON_DIR" ]; then
	echo "Not a linked git worktree — nothing to seed (the primary checkout installs normally)."
	exit 0
fi

# Source checkout to clone from: an explicit argument, else the main working tree behind this
# worktree. `git rev-parse --git-common-dir` points at <primary>/.git, so its parent is the
# primary checkout root.
if [ "$#" -ge 1 ] && [ -n "${1:-}" ]; then
	SRC="$( cd "$1" 2>/dev/null && pwd -P || true )"
	if [ -z "$SRC" ]; then
		echo "Source checkout '$1' does not exist." >&2
		exit 1
	fi
else
	SRC="$( cd "$GIT_COMMON_DIR/.." 2>/dev/null && pwd -P || true )"
fi

DEST="$MONOREPO_ROOT"

if [ -z "$SRC" ] || [ "$SRC" = "$DEST" ]; then
	echo "No usable source checkout to clone from — run 'jp install' to install normally."
	exit 0
fi

if [ ! -d "$SRC/node_modules" ]; then
	echo "Source checkout $SRC has no node_modules to clone — run 'jp install' to install normally."
	exit 0
fi

# Idempotent: never clobber an existing install. If node_modules is already here, do nothing and
# let `jp install` reconcile it.
if [ -e "$DEST/node_modules" ]; then
	echo "This worktree already has node_modules — leaving it untouched. Run 'jp install' to update."
	exit 0
fi

# clonefile(2) only works within a single filesystem. Compare device numbers so we can tell the
# user whether they're getting the fast copy-on-write path or a full copy.
SRC_DEV="$( stat -f %d "$SRC" 2>/dev/null || echo A )"
DEST_DEV="$( stat -f %d "$DEST" 2>/dev/null || echo B )"
if [ "$SRC_DEV" = "$DEST_DEV" ]; then
	CP_OPTS="-Rc"
	echo "Cloning node_modules from $SRC (copy-on-write; same volume)…"
else
	CP_OPTS="-R"
	echo "Copying node_modules from $SRC (different volume — full copy, slower)…"
fi

# Clone every top-level node_modules directory (the root plus each workspace package). `-prune`
# stops the walk at each match, so we never descend into node_modules/.pnpm and re-copy nested
# trees — every match is a disjoint top-level tree, recreated at the same relative path in DEST.
COUNT=0
while IFS= read -r dir; do
	rel="${dir#./}"
	parent="$( dirname "$rel" )"
	if [ "$parent" != "." ]; then
		mkdir -p "$DEST/$parent"
	fi
	# shellcheck disable=SC2086 -- CP_OPTS is an intentional multi-flag word.
	cp $CP_OPTS "$SRC/$rel" "$DEST/$rel"
	COUNT=$(( COUNT + 1 ))
done <<EOF
$( cd "$SRC" && find . -type d -name node_modules -prune )
EOF

echo "Seeded $COUNT node_modules director$( [ "$COUNT" = 1 ] && echo y || echo ies ) into this worktree."
echo "Now run 'jp install' to reconcile against this worktree's lockfile (a no-op when it matches)."
