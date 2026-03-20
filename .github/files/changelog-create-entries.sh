#!/bin/bash
##
# Parse AI response and create changelog entries using the changelogger CLI,
# then commit and push from the PR checkout.
#
# Required env vars: RESPONSE, PR_NUMBER, CHANGELOGGER, KNOWN_PROJECTS
# Expects to be run from the repository root (GITHUB_WORKSPACE).
##

set -euo pipefail

# Parse the JSON response and create changelog entries.
ENTRY_COUNT=$(echo "$RESPONSE" | jq '.entries | length')

if [ "$ENTRY_COUNT" -eq 0 ]; then
	echo "No changelog entries to create; skipping."
	exit 0
fi

echo "Creating $ENTRY_COUNT changelog entries..."

for i in $(seq 0 $(( ENTRY_COUNT - 1 ))); do
	PROJECT=$(echo "$RESPONSE" | jq -r ".entries[$i].project")
	SIGNIFICANCE=$(echo "$RESPONSE" | jq -r ".entries[$i].significance")
	TYPE=$(echo "$RESPONSE" | jq -r ".entries[$i].type")
	ENTRY=$(echo "$RESPONSE" | jq -r ".entries[$i].entry")
	COMMENT=$(echo "$RESPONSE" | jq -r ".entries[$i].comment")

	echo "--- Entry $((i+1)): $PROJECT ($SIGNIFICANCE/$TYPE)"

	# Validate project path: must match expected pattern and be a known project.
	if ! echo "$PROJECT" | grep -qE '^(plugins|packages|projects)/[a-zA-Z0-9_-]+$'; then
		echo "WARNING: Invalid project path format: $PROJECT — skipping."
		continue
	fi
	if ! echo "$KNOWN_PROJECTS" | grep -qxF "$PROJECT"; then
		echo "WARNING: Project not in detected list: $PROJECT — skipping."
		continue
	fi

	PROJECT_DIR="$GITHUB_WORKSPACE/pr-checkout/projects/$PROJECT"
	if [ ! -d "$PROJECT_DIR" ]; then
		echo "WARNING: Project directory not found: $PROJECT_DIR — skipping."
		continue
	fi

	cd "$PROJECT_DIR"

	ARGS=(--no-interaction -s "$SIGNIFICANCE" -t "$TYPE" -f "pr-$PR_NUMBER")
	if [ -n "$ENTRY" ]; then
		ARGS+=(-e "$ENTRY")
	else
		ARGS+=(-e "")
	fi
	if [ -n "$COMMENT" ]; then
		ARGS+=(-c "$COMMENT")
	fi

	"$CHANGELOGGER" add "${ARGS[@]}"
	echo "  Created entry for $PROJECT"
done

# Commit and push from the PR checkout.
cd "$GITHUB_WORKSPACE/pr-checkout"
git add "projects/*/*/changelog/pr-$PR_NUMBER"
if git diff --cached --quiet; then
	echo "No changelog files to commit."
else
	git commit -m "Add changelog entries."
	git push
	echo "Changelog entries committed and pushed."
fi
