#!/usr/bin/env bash

set -eo pipefail

cd "$( dirname "${BASH_SOURCE[0]}" )/.."
BASE="$PWD"
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/alpha-tag.sh"

ARGS=( "--basedir=$BASE" )
ARGS2=()
if [[ -n "$CI" ]]; then
	ARGS+=( '--gh-action' )
fi

DEBUG=false
if [[ "$1" == "--debug" ]]; then
	DEBUG=true
	ARGS+=( '-v' )
	ARGS2+=( '-v' )
fi

if [[ ! -e projects/packages/changelogger/vendor/autoload.php ]]; then
	info "Executing composer update in projects/packages/changelogger"
	(cd projects/packages/changelogger && composer update)
fi

function err {
    if [[ -n "$CI" ]]; then
        echo "::error::$*"
    else
        error "$*"
    fi
}

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
		CHANGELOGGER="$BASE/projects/packages/changelogger/bin/changelogger"
	else
		# For now, do nothing. At some point in the future, maybe this will become an error.
		$DEBUG && debug "$SLUG does not use changelogger"
		continue
	fi

	info "Validating change entries for $SLUG"
	if ! $CHANGELOGGER validate "${ARGS[@]}"; then
		EXIT=1
		continue
	fi

	info "Checking version numbers $SLUG"
	CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
	PRERELEASE=$(alpha_tag $CHANGELOGGER composer.json 0)
	if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
		VER=$($CHANGELOGGER version next --default-first-version --prerelease=$PRERELEASE) || { err "$VER"; EXIT=1; continue; }
	else
		VER=$($CHANGELOGGER version current --default-first-version --prerelease=$PRERELEASE) || { err "$VER"; EXIT=1; continue; }
	fi
	if ! $BASE/tools/project-version.sh "${ARGS2[@]}" -c "$VER" "$SLUG"; then
		EXIT=1
		continue
	fi
done
exit $EXIT
