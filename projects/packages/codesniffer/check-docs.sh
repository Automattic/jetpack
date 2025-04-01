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
	SNIFFDOC="docs/$SNIFF.md"
	if [[ ! -f "$SNIFFDOC" ]]; then
		EXIT=1
		echo "File $FILE presumably defines $SNIFF. Please create $SNIFFDOC to document it."
	else
		if ! grep -q --fixed-strings --line-regexp "## $SNIFF" "$SNIFFDOC"; then
			EXIT=1
			echo "$SNIFFDOC lacks the expected \`## $SNIFF\` header."
		fi
		if ! grep -q --fixed-strings --line-regexp "### Messages" "$SNIFFDOC"; then
			EXIT=1
			echo "$SNIFFDOC lacks the expected "Messages" section."
		fi
		if ! grep -q --fixed-strings --line-regexp "### Configuration" "$SNIFFDOC"; then
			EXIT=1
			echo "$SNIFFDOC lacks the expected "Configuration" section."
		fi
	fi
done < <( git ls-files './*Sniff.php' )

exit $EXIT
