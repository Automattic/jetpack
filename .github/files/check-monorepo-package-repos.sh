#!/bin/bash

set -eo pipefail

EXIT=0
for FILE in $(git -c core.quotepath=off ls-files '**/composer.json'); do
	if jq -e '.repositories[]? | select( .type == "path" and ( .url | startswith( "../" ) ) and ( .options?.monorepo? | not ) )' "$FILE" &>/dev/null; then
		EXIT=1
		LINE=$(grep --line-number --max-count=1 '^	"repositories":' "$FILE")
		if [[ -n "$LINE" ]]; then
			echo "::error file=$FILE,line=${LINE%%:*}:: Monorepo repository must be tagged with .options.monorepo"
		else
			echo "::error file=$FILE:: Monorepo repository must be tagged with .options.monorepo"
		fi
	fi
done
exit $EXIT
