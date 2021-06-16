#!/usr/bin/env bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..
BASE=$PWD
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-u] [-v]

		Check that all composer dependencies between monorepo projects are up to date.

		If \`-u\` is passed, update any that aren't and add changelogger change files
		for the updates.
	EOH
	exit 1
}

# Sets options.
UPDATE=false
VERBOSE=false
while getopts ":uvh" opt; do
	case ${opt} in
		u)
			UPDATE=true
			;;
		v)
			VERBOSE=true
			;;
		h)
			usage
			;;
		:)
			die "Argument -$OPTARG requires a value."
			;;
		?)
			error "Invalid argument: -$OPTARG"
			echo ""
			usage
			;;
	esac
done
shift "$(($OPTIND -1))"

if ! $VERBOSE; then
	function debug {
		:
	}
elif [[ -n "$CI" ]]; then
	function debug {
		# Grey doesn't work well in GH's output.
		blue "$@"
	}
fi

function get_packages {
	PACKAGES1=$(jq -nc 'reduce inputs as $in ({}; .[$in.name] |= if $in.extra["branch-alias"]["dev-master"] then [ $in.extra["branch-alias"]["dev-master"], ( $in.extra["branch-alias"]["dev-master"] | sub( "^(?<v>\\d+\\.\\d+)\\.x-dev$"; "^\(.v)" ) ) ] else [ "@dev" ] end )' "$BASE"/projects/packages/*/composer.json)
	PACKAGES2=$(jq -c '( .[][0] | select( . != "@dev" ) ) |= empty' <<<"$PACKAGES1")
}

get_packages

# Use a temp variable so pipefail works
TMP="$(tools/get-build-order.php 2>/dev/null)"
SLUGS=()
mapfile -t SLUGS <<<"$TMP"

if $UPDATE; then
	debug "Making sure changelogger is runnable"
	(cd projects/packages/changelogger && composer update --quiet)
	CL="$BASE/projects/packages/changelogger/bin/changelogger"

	function changelogger {
		local SLUG="$1"
		local ARGS

		ARGS=()
		ARGS=( add --no-interaction --significance=patch )
		if [[ "$SLUG" == "plugins/jetpack" ]]; then
			ARGS+=( --type=other )
		else
			ARGS+=( --type=changed )
		fi
		ARGS+=( --entry="$2" --comment="$3" )

		local OLDDIR=$PWD
		cd "$BASE/projects/$SLUG"
		local CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
		if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
			"$CL" "${ARGS[@]}"
		else
			"$CL" "${ARGS[@]}"
			info "Updating version for $SLUG"
			VER=$("$CL" version next --default-first-version --prerelease=alpha) || { error "$VER"; EXIT=1; cd "$OLDDIR"; return; }
			"$BASE/tools/project-version.sh" -v -u "$VER" "$SLUG"
			get_packages
		fi
		cd "$OLDDIR"
	}
fi

EXIT=0
for SLUG in "${SLUGS[@]}"; do
	debug "Checking dependencies of $SLUG"
	if [[ "$SLUG" == packages/* ]]; then
		PACKAGES="$PACKAGES2"
	else
		PACKAGES="$PACKAGES1"
	fi
	FILE="projects/$SLUG/composer.json"
	if $UPDATE; then
		JSON=$(jq --argjson packages "$PACKAGES" -r 'def ver(e): if $packages[e.key] then if e.value[0:1] == "^" then $packages[e.key][1] else null end // $packages[e.key][0] else e.value end; if .require then .require |= with_entries( .value = ver(.) ) else . end | if .["require-dev"] then .["require-dev"] |= with_entries( .value = ver(.) ) else . end' "$FILE" | tools/prettier --parser=json-stringify)
		DIDCL=false
		if [[ "$JSON" != "$(<"$FILE")" ]]; then
			info "Dependencies of $SLUG changed!"
			echo "$JSON" > "$FILE"

			info "Creating changelog entry for $SLUG"
			changelogger "$SLUG" 'Updated package dependencies.'
			DIDCL=true
		fi
		if [[ -n "$(git -c core.quotepath=off ls-files "projects/$SLUG/composer.lock")" ]]; then
			PROJECTFOLDER="$BASE/projects/$SLUG"
			cd "$PROJECTFOLDER"
			debug "Updating $SLUG composer.lock"
			OLD="$(<composer.lock)"
			"$BASE/tools/composer-update-monorepo.sh" --quiet "$PROJECTFOLDER"
			if [[ "$OLD" != "$(<composer.lock)" ]] && ! $DIDCL; then
				info "Creating changelog entry for $SLUG composer.lock update"
				changelogger "$SLUG" '' 'Updated composer.lock.'
				DIDCL=true
			fi
			cd "$BASE"
		fi
	else
		while IFS=" " read -r PKG VER; do
			EXIT=1
			LINE=$(grep --line-number --fixed-strings --max-count=1 "$PKG" "$FILE")
			if [[ -n "$CI" ]]; then
				M="::error file=$FILE"
				[[ -n "$LINE" ]] && M="$M,line=${LINE%%:*}"
				echo "$M::Must depend on monorepo package $PKG version $VER%0AYou might use \`tools/check-composer-deps.sh -u\` to fix this."
			else
				M="$FILE"
				[[ -n "$LINE" ]] && M="$M:${LINE%%:*}"
				error "$M: Must depend on monorepo package $PKG version $VER"
			fi
		done < <( jq --argjson packages "$PACKAGES" -r '.require // {}, .["require-dev"] // {} | to_entries[] | select( $packages[.key] as $vals | $vals and ( [ .value ] | inside( $vals ) | not ) ) | .key + " " + ( $packages[.key] | join( " or " ) )' "$FILE" )
	fi
done

if ! $UPDATE && [[ "$EXIT" != "0" ]]; then
	jetpackGreen 'You might use `tools/check-composer-deps.sh -u` to fix these errors.'
fi

exit $EXIT
