#!/usr/bin/env bash

set -eo pipefail

# Ensure consistent sorting.
export LC_ALL=C.UTF-8

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

cd "$BASE"
EXIT=0
while IFS= read -r FILE; do
	SNIFF=${FILE%Sniff.php}
	SNIFF=${SNIFF/\/Sniffs\//\/}
	SNIFF=${SNIFF//\//.}
	if [[ ! -f "docs/$SNIFF.md" ]]; then
		EXIT=1
		echo "File $FILE presumably defines $SNIFF. Please create docs/$SNIFF.md to document it."
	else
		F="docs/$SNIFF.md"
		if ! grep -q --fixed-strings --line-regexp "## $SNIFF" "$F"; then
			EXIT=1
			echo "$F lacks the expected \`## $SNIFF\` header."
		fi
		if ! grep -q --fixed-strings --line-regexp "### Messages" "$F"; then
			EXIT=1
			echo "$F lacks the expected "Messages" section."
		fi
		if ! grep -q --fixed-strings --line-regexp "### Configuration" "$F"; then
			EXIT=1
			echo "$F lacks the expected "Configuration" section."
		fi
	fi
done < <( git ls-files './*Sniff.php' )

exit $EXIT
