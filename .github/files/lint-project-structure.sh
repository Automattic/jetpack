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

ROOT_PACKAGE_JSON_ENGINES="$(jq '.engines' package.json)"

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

	# - .github/ must be export-ignored for packages.
	if [[ "$TYPE" == "packages" && "$(git check-attr export-ignore -- $PROJECT/.github/)" != *": export-ignore: set" ]]; then
		EXIT=1
		echo "::error file=$PROJECT/.gitattributes::$PROJECT/.github/ should have git attribute export-ignore."
	fi

	# - package.json engines should match monorepo root package.json engines
	if [[ -e "$PROJECT/package.json" ]]; then
		PACKAGE_JSON_ENGINES="$(jq '.engines' "$PROJECT/package.json")"
		if [[ "$PACKAGE_JSON_ENGINES" != "$ROOT_PACKAGE_JSON_ENGINES" ]]; then
			EXIT=1
			LINE=$(jq --stream --arg obj "$PACKAGE_JSON_ENGINES" 'if length == 1 then .[0][:-1] else .[0] end | if . == ["engines"] then input_line_number - ( $obj | gsub( "[^\n]"; "" ) | length ) else empty end' "$PROJECT/package.json")
			if [[ -n "$LINE" ]]; then
				echo "---" # Bracket message containing newlines for better visibility in GH's logs.
				echo "::error file=$PROJECT/package.json,line=$LINE::Engines must match those in the monorepo root package.json.%0A  \"engines\": ${ROOT_PACKAGE_JSON_ENGINES//$'\n'/%0A  }"
				echo "---"
			else
				LINE=$(wc -l < "$PROJECT/package.json")
				echo "---" # Bracket message containing newlines for better visibility in GH's logs.
				echo "::error file=$PROJECT/package.json,line=$LINE::Engines must be specified, matching those in the monorepo root package.json.%0A  \"engines\": ${ROOT_PACKAGE_JSON_ENGINES//$'\n'/%0A  }"
				echo "---"
			fi
		fi
	fi

	# - package.json for js modules should look like a library to renovate.
	if [[ "$PROJECT" == projects/js-packages/* && -e "$PROJECT/package.json" ]]; then
		! IFS= read -r INDEX < <( ls -- "$PROJECT"/index.{js,jsx,cjs,ts,tsx,d.ts} 2>/dev/null )
		if [[ -n "$INDEX" ]] && ! jq -e '.private // .main // .exports' "$PROJECT/package.json" >/dev/null; then
			echo "::error file=$PROJECT/package.json::$SLUG appears to be a library (it has ${INDEX#$PROJECT/}), but does not specify \`.main\` or \`.exports\` in package.json. This will confuse renovate."
		fi
	fi

	# - composer.json must exist.
	if [[ ! -e "$PROJECT/composer.json" ]]; then
		EXIT=1
		echo "::error file=$PROJECT/composer.json::Project $SLUG does not contain composer.json."
		continue
	fi

	### All tests depending on composer.json must go below here.

	# - composer.json must include a monorepo .repositories entry.
	if ! jq --arg type "$TYPE" -e '.repositories[]? | select( .type == "path" and ( .url == "../../packages/*" or $type == "packages" and .url == "../*" ) )' "$PROJECT/composer.json" >/dev/null; then
		EXIT=1
		echo "::error file=$PROJECT/composer.json::$PROJECT/composer.json should have a \`repositories\` entry pointing to \`../../packages/*\`."
	fi

	# - composer.json must require-dev (or just require) changelogger.
	# - Changelogger's changes-dir must have a .gitkeep.
	# - Changelogger's changes-dir must be production-excluded.
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

	# - Packages must have a dev-master branch-alias.
	if [[ "$TYPE" == "packages" ]] && ! jq -e '.extra["branch-alias"]["dev-master"]' "$PROJECT/composer.json" >/dev/null; then
		EXIT=1
		echo "::error file=$PROJECT/composer.json::Package $SLUG should set \`.extra.branch-alias.dev-master\` in composer.json."
	fi

	SUGGESTION="You might add this with \`composer config autoloader-suffix '$(printf "%s" "$SLUG" | md5sum | sed -e 's/[[:space:]]*-$//')_$(sed -e 's/[^0-9a-zA-Z]/_/g' <<<"${SLUG##*/}")ⓥversion'\` in the appropriate directory."

	# - If vendor/autoload.php or vendor/autoload_packages.php is production-included, composer.json must set .config.autoloader-suffix.
	if [[ -n "$(git check-attr production-include -- "$PROJECT/vendor/autoload.php" "$PROJECT/vendor/autoload_packages.php" | sed -n 's/: production-include: \(unspecified\|unset\)$//;t;s/: production-include: .*//p')" ]] &&
		! jq -e '.config["autoloader-suffix"]' "$PROJECT/composer.json" >/dev/null
	then
		EXIT=1
		echo "---" # Bracket message containing newlines for better visibility in GH's logs.
		echo "::error file=$PROJECT/composer.json::Since $SLUG production-includes an autoloader, $PROJECT/composer.json must set .config.autoloader-suffix.%0AThis avoids spurious changes with every build, cf. https://github.com/Automattic/jetpack-production/commits/master/vendor/autoload.php?after=a59e4613559b9822cfc9db88524f09b669f32296+0.%0A${SUGGESTION}"
		echo "---"
	fi

	# - If vendor/autoload_packages.php is production-included and .config.autoloader-suffix is set, it must contain ⓥ.
	# - Require that the first part of .config.autoloader-suffix is long enough.
	if jq -e '.config["autoloader-suffix"]' "$PROJECT/composer.json" >/dev/null; then
		LINE=$(grep --line-number --max-count=1 '^		"autoloader-suffix":' "$PROJECT/composer.json" || true)
		if [[ -n "$LINE" ]]; then
			LINE=",line=${LINE%%:*}"
		fi
		if [[ -n "$(git check-attr production-include -- "$PROJECT/vendor/autoload_packages.php" | sed -n 's/: production-include: \(unspecified\|unset\)$//;t;s/: production-include: .*//p')" ]] &&
			! jq -e '.config["autoloader-suffix"] | contains( "ⓥ" )' "$PROJECT/composer.json" >/dev/null
		then
			EXIT=1
			echo "---" # Bracket message containing newlines for better visibility in GH's logs.
			echo "::error file=$PROJECT/composer.json$LINE::When the Jetpack Autoloader is production-included, .config.autoloader-suffix must contain \"ⓥ\" (\\u24e5) to avoid https://github.com/Automattic/jetpack/issues/19472.%0A$SUGGESTION"
			echo "---"
		fi
		if jq -e '.config["autoloader-suffix"] | split( "ⓥ" )[0] | length < 32' "$PROJECT/composer.json" >/dev/null; then
			EXIT=1
			echo "::error file=$PROJECT/composer.json$LINE::When set, the part of .config.autoloader-suffix (before the \"ⓥ\" (\\u24e5), if any) must be at least 32 characters.%0A$SUGGESTION"
		fi
	fi

done

# - Composer name fields should not be repeated.
debug "Checking for duplicate composer.json names"
DUPS="$(jq -rn 'reduce inputs as $i ({}; .[$i.name] |= ( . // [] ) + [ input_filename ]) | to_entries[] | .key as $key | .value | select( length > 1 ) | ( [ .[] | capture("^projects/(?<s>.*)/composer\\.json$").s ] | .[-1] |= "and " + . | join( if length > 2 then ", " else " " end ) ) as $slugs | .[] | [ ., $key, $slugs ] | @tsv' projects/*/*/composer.json)"
if [[ -n "$DUPS" ]]; then
	while IFS=$'\t' read -r FILE KEY SLUGS; do
		LINE=$(grep --line-number --max-count=1 '^	"name":' "$FILE" || true)
		if [[ -n "$LINE" ]]; then
			LINE=",line=${LINE%%:*}"
		fi
		EXIT=1
		echo "::error file=$FILE$LINE::Name $KEY is in use in composer.json by $SLUGS. They must be deduplicated."
	done <<<"$DUPS"
fi

# - Renovate should ignore all monorepo packages.
debug "Checking renovate ignore list"
if ! tools/js-tools/check-renovate-ignore-list.js; then
	EXIT=1
fi

# - .nvmrc should match .github/versions.sh.
. .github/versions.sh
debug "Checking .nvmrc vs versions.sh"
if [[ "$(<.nvmrc)" != "$NODE_VERSION" ]]; then
	EXIT=1
	echo "::error file=.nvmrc::Version in .nvmrc must be $NODE_VERSION, to match .github/versions.sh."
fi

# - package.json engines should be satisfied by .github/versions.sh.
debug "Checking .github/versions.sh vs package.json engines"
RANGE="$(jq -r '.engines.node' package.json)"
if ! pnpx semver --range "$RANGE" "$NODE_VERSION" &>/dev/null; then
	EXIT=1
	LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["engines","node"] then input_line_number - 1 else empty end' package.json)
	echo "::error file=package.json,line=$LINE::Node version $NODE_VERSION in .github/versions.sh does not satisfy requirement $RANGE from package.json"
fi
RANGE="$(jq -r '.engines.pnpm' package.json)"
if ! pnpx semver --range "$RANGE" "$PNPM_VERSION" &>/dev/null; then
	EXIT=1
	LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["engines","pnpm"] then input_line_number - 1 else empty end' package.json)
	echo "::error file=package.json,line=$LINE::Pnpm version $PNPM_VERSION in .github/versions.sh does not satisfy requirement $RANGE from package.json"
fi

exit $EXIT
