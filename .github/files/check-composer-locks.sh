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
		echo "::error file=$FILE::$FILE is not up to date!"
		EXIT=1
	fi
	cd "$OLDPWD"
done

exit $EXIT
