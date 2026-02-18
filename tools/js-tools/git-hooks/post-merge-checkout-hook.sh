#!/usr/bin/env bash

# Skip if previous ref is null, e.g. during `git worktree add`
if [[ -z "$1" || "$1" = "0000000000000000000000000000000000000000" ]]; then
	exit 0
fi

changedFiles="$(git -c core.quotepath=off diff-tree -r --name-only --no-commit-id "$1" HEAD)"
SEP=$'---\n'

# Collect changed project slugs directly from the changed files list.
changedSlugs=()
for slug in $(sed -n 's#^projects/\([^/]*/[^/]*\)/composer\.lock$#\1#p' <<<"$changedFiles"); do
	changedSlugs+=("$slug")
done

# Check if root lock files changed.
rootChanged=
if grep -q '^\(pnpm-lock\.yaml\|composer\.lock\)$' <<<"$changedFiles"; then
	rootChanged=1
fi

if [[ ${#changedSlugs[@]} -gt 0 || -n "$rootChanged" ]]; then
	installArgs=()
	if [[ -n "$rootChanged" ]]; then
		installArgs+=("-r")
	fi
	installArgs+=("${changedSlugs[@]}")

	# Detect whether to suggest `jetpack` or `jp` based on hook configuration.
	if git config core.hooksPath > /dev/null 2>&1; then
		CLI_CMD="jetpack"
	else
		CLI_CMD="jp"
	fi

	echo -e "${SEP}Lock files have changed. To update, run:\n  $CLI_CMD install ${installArgs[*]}"
	SEP=
fi

exit 0
