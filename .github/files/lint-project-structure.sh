#!/bin/bash

set -eo pipefail
shopt -s dotglob

cd $(dirname "${BASH_SOURCE[0]}")/../..
BASE=$PWD
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

if [[ -n "$CI" ]]; then
	function debug {
		blue "$@"
	}
fi

EXIT=0
declare -A OKFILES
for F in README.md .gitkeep .gitignore; do
	OKFILES[$F]=1
done

# - projects/ should generally contain directories. But certain files are ok.
for PROJECT in projects/*; do
	if [[ ! -d "$PROJECT" ]]; then
		if [[ -n "${OKFILES[${PROJECT#projects/}]}" ]]; then
			debug "Ignoring file $PROJECT"
		else
			EXIT=1
			echo "::error file=$PROJECT::Project directories should not contain normal files."
		fi
	fi
done

for PROJECT in projects/*/*; do
	SLUG="${PROJECT#projects/}"
	TYPE="${SLUG%/*}"

	# - projects/*/ should also generally contain directories. But certain files are ok.
	if [[ ! -d "$PROJECT" ]]; then
		if [[ -n "${OKFILES[${SLUG#*/}]}" ]]; then
			debug "Ignoring file $PROJECT"
		else
			EXIT=1
			echo "::error file=$PROJECT::Project directories should not contain normal files."
		fi
		continue
	fi

	debug "Checking project $SLUG"

	# - composer.json must exist.
	# - composer.json must include a monorepo .repositories entry.
	# - composer.json must require-dev (or just require) changelogger.
	# - Changelogger's changes-dir must have a .gitkeep.
	# - Changelogger's changes-dir must be production-excluded.
	if [[ ! -e "$PROJECT/composer.json" ]]; then
		EXIT=1
		echo "::error file=$PROJECT/composer.json::Project $SLUG does not contain composer.json."
	else
		if ! jq --arg type "$TYPE" -e '.repositories[]? | select( .type == "path" and ( .url == "../../packages/*" or $type == "packages" and .url == "../*" ) )' "$PROJECT/composer.json" >/dev/null; then
			EXIT=1
			echo "::error file=$PROJECT/composer.json::$PROJECT/composer.json should have a \`repositories\` entry pointing to \`../../packages/*\`."
		fi
		if [[ "$SLUG" != "packages/changelogger" ]] && ! jq -e '.require["automattic/changelogger"] // .["require-dev"]["automattic/jetpack-changelogger"]' "$PROJECT/composer.json" >/dev/null; then
			EXIT=1
			echo "::error file=$PROJECT/composer.json::Project $SLUG should include automattic/jetpack-changelogger in \`require-dev\`."
		else
			CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' "$PROJECT/composer.json")"
			if [[ ! -e "$PROJECT/$CHANGES_DIR/.gitkeep" ]]; then
				EXIT=1
				echo "::error file=$PROJECT/$CHANGES_DIR/.gitkeep::Project $SLUG should have a file at $CHANGES_DIR/.gitkeep so that $CHANGES_DIR does not get removed when releasing."
			fi
			if [[ "$(git check-attr production-exclude -- $PROJECT/$CHANGES_DIR/file)" != *": production-exclude: set" ]]; then
				EXIT=1
				echo "::error file=$PROJECT/.gitattributes::Files in $PROJECT/$CHANGES_DIR/ must have git attribute production-exclude."
			fi
		fi
	fi

	# - .github/ must be export-ignored for packages.
	if [[ "$TYPE" == "packages" && "$(git check-attr export-ignore -- $PROJECT/.github/)" != *": export-ignore: set" ]]; then
		EXIT=1
		echo "::error file=$PROJECT/.gitattributes::$PROJECT/.github/ should have git attribute export-ignore."
	fi

done

exit $EXIT
