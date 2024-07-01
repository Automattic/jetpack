#!/usr/bin/env bash
# This script allows a user to install repo-recommended VS Code settings.
# See: p1HpG7-sQE-p2
#
# Exit codes:
#   0: All is well
#   1: Repo settings template is missing
#   2: Settings file creation failed

# Go to monorepo root.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

template_file=.vscode/settings.dist.jsonc
dest_file=.vscode/settings.json

# Abort if repo settings file is missing.
if [[ ! -f "$template_file" ]]; then
	echo "Repo settings template is missing; aborting."
	exit 1
fi

# Abort if settings file already exists and managed comment is missing.
managed_comment='// This is a managed VS Code settings file.'
if [[ -f "$dest_file" ]]; then
	if diff -q "$template_file" "$dest_file" > /dev/null; then
		echo 'Managed settings are up to date; no changes needed.'
		exit
  elif [[ $(head -1 "$dest_file") != "$managed_comment" ]]; then
		echo "Custom settings file; aborting."
		exit
	fi
fi

# Copy file into place.
cp "$template_file" "$dest_file"

# Verify success.
if [[ ! -f "$dest_file" ]] || ! diff -q "$template_file" "$dest_file" > /dev/null; then
	echo "Error copying settings into place!"
	exit 2
fi

echo "Copied managed settings into place."
