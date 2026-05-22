#!/usr/bin/env bash
#
# check-skill-registration.sh
#
# Verifies that every `.agents/skills/premium-analytics-*.md` skill has a matching
# slash-command stub at `.claude/commands/<name>.md`. Catches the "Args from unknown
# skill" failure mode where a skill file is added but its command stub is forgotten,
# which surfaces only at invocation time with an unhelpful error.
#
# Scope is intentionally narrow (premium-analytics skills only). Other namespaces
# may opt in by extending the glob below — see `.agents/SKILL-NAMING.md`.
#
# Usage:
#   bash .agents/check-skill-registration.sh
#
# Exit codes:
#   0  — every in-scope skill has a stub
#   1  — one or more skills are missing their stubs (the count + names are printed)
#   2  — tool error (could not resolve repo root from script location)

set -euo pipefail

# Derive repo root from this script's location (consistent with the
# BASH_SOURCE/dirname pattern in tools/*.sh).
#
# Then validate explicitly: command-substitution failures don't trigger
# set -e, so if the `cd` inside $(...) fails (script moved, broken symlink,
# unusual BASH_SOURCE value, …) BASE would silently become empty and
# `cd "$BASE"` would land in $HOME — the nullglob loop would then print
# "OK" without checking anything. Probe for two expected repo subtrees as
# a cheap structural sanity check.
BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
if [ -z "$BASE" ] || [ ! -d "$BASE/.agents/skills" ] || [ ! -d "$BASE/.claude/commands" ]; then
	echo "Error: could not resolve repo root from script location (BASE='$BASE')." >&2
	echo "Expected \$BASE/.agents/skills and \$BASE/.claude/commands to exist." >&2
	exit 2
fi
cd "$BASE"

missing=0

shopt -s nullglob
for skill in .agents/skills/premium-analytics-*.md; do
	name=$(basename "$skill" .md)
	stub=".claude/commands/${name}.md"
	if [ ! -f "$stub" ]; then
		echo "MISSING STUB: $stub (for $skill)"
		missing=$((missing + 1))
	fi
done
shopt -u nullglob

if [ "$missing" -eq 0 ]; then
	echo "OK: all premium-analytics skills have command stubs."
	exit 0
fi

echo ""
echo "Found $missing skill(s) without a slash-command stub."
echo "Each .agents/skills/premium-analytics-*.md must have a matching"
echo ".claude/commands/<name>.md — see .agents/SKILL-NAMING.md."
exit 1
