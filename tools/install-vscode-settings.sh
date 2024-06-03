#!/usr/bin/env bash
# This script allows a user to install repo-recommended VS Code settings.
# See: p1HpG7-sQE-p2
#
# Exit codes:
#   0: all is well
#   1: Repo settings template is missing
#   2: Symlink creation failed

# Go to monorepo root.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Abort if settings file already exists.
if [[ -f .vscode/settings.json ]]; then
	echo "Settings file exists; aborting."
	exit
fi

# Abort if repo settings file is missing.
if [[ ! -f .vscode/settings.dist.json ]]; then
	echo "Repo settings template is missing; aborting."
	exit 1
fi

# Create symlink.
ln -s settings.dist.json .vscode/settings.json

# Verify success.
if [[ ! -f .vscode/settings.json ]]; then
	echo "Failed to create symlink!"
	exit 2
fi

echo "Created VS Code settings symlink: .vscode/settings.json"
