#!/bin/bash

set -eo pipefail

EXIT=0
for FILE in $(git ls-files 'composer.lock' '**/composer.lock'); do
	cd $(dirname "$FILE")
	echo "::group::$FILE - composer install"
	composer install
	echo "::endgroup::"
	echo "::group::$FILE - composer update"
	composer update --root-reqs
	echo "::endgroup::"
	if ! git diff --exit-code composer.lock; then
		echo "---" # Bracket message containing newlines for better visibility in GH's logs.
		echo "::error file=$FILE::$FILE is not up to date!%0AYou can probably fix this by running \`composer update --root-reqs\` in the appropriate directory."
		echo "---"
		EXIT=1
	fi
	cd "$OLDPWD"
done

for FILE in $(git ls-files 'yarn.lock' '**/yarn.lock'); do
	cd $(dirname "$FILE")
	echo "::group::$FILE - yarn install --frozen-lockfile"
	if yarn install --frozen-lockfile; then
		echo "::endgroup::"
	else
		echo "::endgroup::"
		echo "::error file=$FILE::$FILE is not up to date!%0AYou can probably fix this by running \`yarn install\` in the appropriate directory."
		EXIT=1
	fi
	cd "$OLDPWD"
done

exit $EXIT
