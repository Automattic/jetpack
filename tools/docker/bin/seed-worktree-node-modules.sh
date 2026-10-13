#!/usr/bin/env bash

# seed-worktree-node-modules.sh — give a fresh git worktree a node_modules by cloning it from an
# already-installed checkout, instead of paying for a full `pnpm install` over Docker's (slow, on
# macOS) bind mount.
#
# Why this is safe and correct:
#   - This monorepo forbids from-source native builds (pnpm-workspace.yaml: `strictDepBuilds: true`
#     with every `allowBuilds` entry `false`). So node_modules is a pure function of the committed
#     lockfile and the target os/cpu/libc — never of the Node ABI. A tree installed in one checkout
#     is valid in another on the same platform.
#   - pnpm's layout is relocatable: node_modules/.pnpm holds relative symlinks plus hardlinks into
#     the shared, content-addressed store (mirror-mounted at the same path inside the container by
#     `monorepo` in this directory). Copy the tree to a new checkout path and the relative links
#     stay valid and the store references still resolve.
#   - This script only SEEDS the tree. It does not make it authoritative: run `jp install` afterward
#     and pnpm reconciles against this worktree's own lockfile and platform, so a stale or
#     slightly-divergent seed can never ship a wrong tree.
#
# When it is worth running. Measured on an M-series Mac (APFS, warm pnpm store, source and target
# lockfiles identical), seeding ~490k entries costs about 2m30s, so it only pays off against an
# install that is slower than that:
#   - Installing in the container (`jp install`): 4m24s from scratch, versus 2m30s to seed plus 7s
#     to reconcile. Worth it — roughly 40% off.
#   - Installing natively on the host (`pnpm install` directly): 32s from scratch, versus 2m30s to
#     seed plus 4s to reconcile. NOT worth it — seed only when you install through Docker.
#
# The copy is a per-file clonefile(2) on APFS (`cp -Rc`): copy-on-write, so it adds almost no disk
# until a file diverges, but it still costs a syscall per file, which is where those 2m30s go. On
# other filesystems it falls back to a plain recursive copy — correct, but neither fast nor free.
#
# Like seed-worktree-env.sh, this is:
#   - host-only (run it on your machine, not inside the container — it clones host files),
#   - idempotent (a no-op if this worktree already has any node_modules), and
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

# Idempotent: never clobber an existing install. This has to check *every* node_modules in the
# worktree, not just the root one: `cp -R a/node_modules b/node_modules` nests the copy as
# b/node_modules/node_modules when the target directory already exists, so a destination that is
# even partly populated has to be cleared before we start rather than merged into.
EXISTING_DIRS="$( find . -type d -name node_modules -prune )"
if [ -n "$EXISTING_DIRS" ]; then
	echo "This worktree already has node_modules — leaving it untouched. Run 'jp install' to update."
	echo "To re-seed from scratch, remove them first:"
	echo "    find . -type d -name node_modules -prune -print0 | xargs -0 rm -rf"
	exit 0
fi

# Every top-level node_modules directory in the source (the root plus each workspace package).
# `-prune` stops the walk at each match, so we never descend into node_modules/.pnpm and re-copy
# nested trees — every match is a disjoint top-level tree, recreated at the same relative path.
#
# Capture the list into a variable first so a cd/find failure is visible to set -e. Reading it
# straight out of a heredoc or process substitution would swallow the exit status and hand the loop
# a single empty line, which `cp "$SRC/" "$DEST/"` reads as "copy the entire checkout over the
# worktree". (seed-worktree-env.sh notes the same trap for `git worktree list`.)
SRC_DIRS="$( cd "$SRC" && find . -type d -name node_modules -prune )"
if [ -z "$SRC_DIRS" ]; then
	echo "Found no node_modules directories in $SRC — run 'jp install' to install normally."
	exit 0
fi

case "$( uname -s )" in
	Darwin )
		# clonefile(2) only works within a single filesystem. `cp -c` falls back to copyfile(2) on
		# its own, so comparing device numbers only buys us an accurate heads-up about the cost.
		SRC_DEV="$( stat -f %d "$SRC" 2>/dev/null || echo A )"
		DEST_DEV="$( stat -f %d "$DEST" 2>/dev/null || echo B )"
		if [ "$SRC_DEV" = "$DEST_DEV" ]; then
			CP_OPTS="-Rc"
			echo "Cloning node_modules from $SRC (copy-on-write; same volume)…"
		else
			CP_OPTS="-R"
			echo "Copying node_modules from $SRC (different volume — full copy, slower)…"
		fi
		;;
	* )
		# GNU cp spells copy-on-write `--reflink=auto`, which quietly falls back to a full copy
		# where the filesystem can't do it. `-c` is macOS-only and GNU cp rejects it outright, so
		# never send it anywhere but Darwin.
		if cp --version 2>/dev/null | grep -q GNU; then
			CP_OPTS="-R --reflink=auto"
			echo "Copying node_modules from $SRC (copy-on-write where the filesystem supports it)…"
		else
			CP_OPTS="-R"
			echo "Copying node_modules from $SRC (full copy, slower)…"
		fi
		;;
esac

# From here on we are writing into the worktree, for long enough that a ^C part-way through is a
# real possibility. Track what we create and remove it if we don't finish: the idempotency check
# above would otherwise mistake a half-copied tree for a real install and refuse to re-seed it.
SEEDED=""
seed_failed() {
	STATUS=$?
	trap - EXIT INT TERM
	if [ "$STATUS" = 0 ] || [ -z "$SEEDED" ]; then
		exit "$STATUS"
	fi
	echo "" >&2
	echo "Seeding did not finish — removing the partial tree so the next run starts clean." >&2
	printf '%s\n' "$SEEDED" | while IFS= read -r seeded_path; do
		if [ -n "$seeded_path" ]; then
			rm -rf "$seeded_path"
		fi
	done
	exit "$STATUS"
}
trap seed_failed EXIT INT TERM

COUNT=0
while IFS= read -r dir; do
	[ -n "$dir" ] || continue
	rel="${dir#./}"
	parent="$( dirname "$rel" )"
	if [ "$parent" != "." ]; then
		mkdir -p "$DEST/$parent"
	fi
	SEEDED="$SEEDED
$DEST/$rel"
	# shellcheck disable=SC2086 # CP_OPTS is an intentional multi-flag word.
	cp $CP_OPTS "$SRC/$rel" "$DEST/$rel"
	COUNT=$(( COUNT + 1 ))
done <<EOF
$SRC_DIRS
EOF

trap - EXIT INT TERM

echo "Seeded $COUNT node_modules director$( [ "$COUNT" = 1 ] && echo y || echo ies ) into this worktree."
echo "Now run 'jp install' to reconcile against this worktree's lockfile and platform."
