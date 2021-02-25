#!/usr/bin/env bash

set -eo pipefail

cd "$( dirname "${BASH_SOURCE[0]}" )/.."
BASE="$PWD"
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

ARGS=( "--basedir=$BASE" )
if [[ -n "$CI" ]]; then
	ARGS+=( '--gh-action' )
fi

DEBUG=false
if [[ "$1" == "--debug" ]]; then
	DEBUG=true
	ARGS+=( '-v' )
fi

EXIT=0
for FILE in projects/*/*/composer.json; do
	DIR="${FILE%/composer.json}"
	SLUG="${DIR#projects/}"
	cd "$BASE/$DIR"

	if [[ -x vendor/bin/changelogger ]]; then
		CHANGELOGGER=vendor/bin/changelogger
	elif [[ "$DIR" == "projects/packages/changelogger" ]]; then
		CHANGELOGGER=bin/changelogger
	elif jq -e '.["require"]["automattic/jetpack-changelogger"] // .["require-dev"]["automattic/jetpack-changelogger"] // false' composer.json > /dev/null; then
		CHANGELOGGER=vendor/bin/changelogger
	else
		# For now, do nothing. At some point in the future, maybe this will become an error.
		$DEBUG && debug "$SLUG does not use changelogger"
		continue
	fi

	info "Validating change entries for $SLUG"
	if $DEBUG && [[ -n "$CI" ]]; then
		echo "::group::Executing composer install for $SLUG"
		composer install
		echo "::endgroup::"
	else
		composer install --quiet
	fi
	if ! $CHANGELOGGER validate "${ARGS[@]}"; then
		EXIT=1
	fi
done
exit $EXIT
