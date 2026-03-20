#!/bin/bash
##
# Prepare input files for AI changelog generation.
#
# Generates the diff, checks its size, and writes temp files for project types,
# project list, plugin deps, and PR description — all as file_input for
# actions/ai-inference.
#
# Required env vars: BASE, HEAD, PROJECTS, PLUGIN_DEPS, PR_DESCRIPTION, PR_TITLE, PR_NUMBER
# Outputs: too_large, diff_file, types_file, projects_file, deps_file, pr_desc_file, pr_title_file, pr_number_file
##

set -euo pipefail

# Generate diff and check size.
DIFF_FILE=$(mktemp)
git diff "$BASE...$HEAD" > "$DIFF_FILE"
DIFF_SIZE=$(wc -c < "$DIFF_FILE")
echo "Diff size: $DIFF_SIZE characters"

if [ "$DIFF_SIZE" -gt 50000 ]; then
	echo "too_large=true" >> "$GITHUB_OUTPUT"
	echo "Diff exceeds 50K character threshold."
	exit 0
fi

echo "too_large=false" >> "$GITHUB_OUTPUT"
echo "diff_file=$DIFF_FILE" >> "$GITHUB_OUTPUT"

# Read each project's available changelog types from composer.json.
TYPES_FILE=$(mktemp)
while IFS= read -r proj; do
	[ -z "$proj" ] && continue
	COMPOSER="projects/$proj/composer.json"
	if [ -f "$COMPOSER" ]; then
		PROJ_TYPES=$(php -r "
			\$d = json_decode(file_get_contents('$COMPOSER'), true);
			\$types = \$d['extra']['changelogger']['types'] ?? null;
			if (\$types) echo implode(', ', array_keys(\$types));
		" 2>/dev/null || true)
		if [ -n "$PROJ_TYPES" ]; then
			echo "${proj}: ${PROJ_TYPES}" >> "$TYPES_FILE"
		fi
	fi
done <<< "$PROJECTS"
echo "types_file=$TYPES_FILE" >> "$GITHUB_OUTPUT"

# Write projects and plugin deps to temp files for file_input.
PROJECTS_FILE=$(mktemp)
echo "$PROJECTS" > "$PROJECTS_FILE"
echo "projects_file=$PROJECTS_FILE" >> "$GITHUB_OUTPUT"

DEPS_FILE=$(mktemp)
echo "${PLUGIN_DEPS:-}" > "$DEPS_FILE"
echo "deps_file=$DEPS_FILE" >> "$GITHUB_OUTPUT"

PR_DESC_FILE=$(mktemp)
echo "${PR_DESCRIPTION:-}" > "$PR_DESC_FILE"
echo "pr_desc_file=$PR_DESC_FILE" >> "$GITHUB_OUTPUT"

PR_TITLE_FILE=$(mktemp)
printf '%s' "$PR_TITLE" > "$PR_TITLE_FILE"
echo "pr_title_file=$PR_TITLE_FILE" >> "$GITHUB_OUTPUT"

PR_NUMBER_FILE=$(mktemp)
printf '%s' "$PR_NUMBER" > "$PR_NUMBER_FILE"
echo "pr_number_file=$PR_NUMBER_FILE" >> "$GITHUB_OUTPUT"
