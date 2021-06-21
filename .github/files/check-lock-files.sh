#!/bin/bash

set -eo pipefail

BASE="$PWD"

EXIT=0
for FILE in $(git -c core.quotepath=off ls-files 'composer.lock' '**/composer.lock'); do
	DIR="$(dirname "$FILE")"
	cd "$DIR"
	echo "::group::$FILE - composer install"
	composer install
	echo "::endgroup::"
	echo "::group::$FILE - composer update"
	"$BASE/tools/composer-update-monorepo.sh" --root-reqs .
	echo "::endgroup::"
	if ! git diff --exit-code composer.lock; then
		echo "---" # Bracket message containing newlines for better visibility in GH's logs.
		echo "::error file=$FILE::$FILE is not up to date!%0AYou can probably fix this by running \`tools/composer-update-monorepo.sh --root-reqs \"${DIR}\"\`."
		echo "---"
		EXIT=1
	fi
	cd "$BASE"
done

for FILE in $(git -c core.quotepath=off ls-files 'pnpm-lock.yaml' '**/pnpm-lock.yaml'); do
	cd $(dirname "$FILE")
	echo "::group::$FILE - pnpm install"
	pnpm install
	echo "::endgroup::"
	if ! git diff --exit-code pnpm-lock.yaml; then
		echo "---" # Bracket message containing newlines for better visibility in GH's logs.
		echo "::error file=$FILE::$FILE is not up to date!%0AYou can probably fix this by running \`pnpm install\` in the appropriate directory."
		echo "---"
		EXIT=1
	fi
	cd "$BASE"
done

exit $EXIT
