#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/plugin-functions.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-v] -c version <slug>

		  Check that the project's versions are updated to the specified version.

		usage: $0 [-f] [-v] -u version <slug>

		  Update the versions of the specified project.

		  Specifying -f updates the referenced version in other packages that depend
		  on the updated package (see tools/check-intra-monorepo-deps.sh -ua).

		The following version numbers are updated:
		   - Version in the WordPress plugin header, if applicable.
		   - Version in composer.json, if any.
		   - Branch-alias version in composer.json, if any.
		   - Version in package.json, if any.
		   - Any constants defined in composer.json's .extras.version-constants.
	EOH
	exit 1
}

if [[ $# -eq 0 ]]; then
	usage
fi

# Sets options.
OP=
VERBOSE=false
FIX_INTRA_MONOREPO_DEPS=false
while getopts ":c:u:fvsh" opt; do
	case ${opt} in
		c)
			[[ -z "$OP" ]] || die "Only one of -c or -u may be specified"
			VERSION=$OPTARG
			OP=check
			OPING=Checking
			;;
		u)
			[[ -z "$OP" ]] || die "Only one of -c or -u may be specified"
			VERSION=$OPTARG
			OP=update
			OPING=Updating
			;;
		f)
			FIX_INTRA_MONOREPO_DEPS=true
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

[[ -z "$OP" ]] && die "Either -c or -u must be specified"

if ! $VERBOSE; then
	function debug {
		:
	}
fi

# Determine the project
[[ -z "$1" ]] && die "A project slug must be specified."
SLUG="${1#projects/}" # DWIM
SLUG="${SLUG%/}" # Sanitize
if [[ ! -e "$BASE/projects/$SLUG/composer.json" ]]; then
	die "Project $SLUG does not exist."
fi

EXIT=0
FIXHINT=false

# Check/update version numbers with sed/grep.
#  - $1: File.
#  - $2: Regex pattern, matching a whole line, escaped for `/` delimiters, with capturing group 2 being the version and 1 and 3 any content to keep before or after it.
#  - $3: Expected version.
#  - $4: What is being looked for, if not finding it is a problem.
function sedver {
	if [[ "$OP" == "update" ]]; then
		VE=$(sed 's/[&\\/]/\\&/g' <<<"$3")
		sed -i.bak -E "s/$2/\1${VE}\3/" "$1"
		rm "$1.bak" # We need a backup file because macOS requires it.
		return
	fi

	VER=$(sed -nE "s/$2/\2/p" "$1")
	if [[ -z "$VER" ]]; then
		if [[ -z "$4" ]]; then
			debug "Ok, no version found to $OP"
		else
			EXIT=1
			if [[ -n "$CI" ]]; then
				echo "::error file=${1#$BASE/}::Did not find $4 to $OP."
			else
				error "${1#$BASE/}: Did not find $4 to $OP."
			fi
		fi
	elif [[ "$VER" == "$3" ]]; then
		debug "Ok, $VER == $3"
	else
		EXIT=1
		LINE=$(grep --line-number --max-count=1 -E "$2" "$1" || true)
		if [[ -n "$CI" ]]; then
			echo "---" # Bracket message containing newlines for better visibility in GH's logs.
			echo "::error file=${1#$BASE/},line=${LINE%%:*}::Version mismatch, expected $3 but found $VER!%0AYou might use \`tools/project-version.sh -f -u $VERSION $SLUG\` or \`tools/fixup-project-versions.sh\` to fix this."
			echo "---"
		else
			error "${1#$BASE/}:${LINE%%:*}: Version mismatch, expected $3 but found $VER!"
			FIXHINT=true
		fi
	fi
}

# Check/update version numbers in a json file.
#  - $1: File.
#  - $2: Path for jq.
#  - $3: Expected version.
#  - $4: What is being looked for, if not finding it is a problem.
function jsver {
	if [[ "$OP" == "update" ]]; then
		JSON=$(jq --tab --arg v "$3" "if $2 then $2 |= \$v else . end" "$1")
		if [[ "$JSON" != "$(<"$FILE")" ]]; then
			echo "$JSON" > "$FILE"
		fi
		return
	fi

	X=$(sed -E 's/\["([^"]+)"\]/.\1/g' <<<"$2")
	N="${X//[^.]}"
	N="${#N}"
	VER=$(jq -r "$2 // \"\"" "$1")
	if [[ -z "$VER" ]]; then
		if [[ -z "$4" ]]; then
			debug "Ok, no version found to $OP"
		else
			EXIT=1
			if [[ -n "$CI" ]]; then
				echo "::error file=${1#$BASE/}::Did not find $4 to $OP."
			else
				error "${1#$BASE/}: Did not find $4 to $OP."
			fi
		fi
	elif [[ "$VER" == "$3" ]]; then
		debug "Ok, $VER == $3"
	else
		EXIT=1
		VE=$(jq --arg v "$VER" -n '$v' | sed 's/[.\[\]\\*^$\/()+?{}|]/\\&/g')
		LINE=$(grep --line-number --max-count=1 -E "^	{$N}\"${X##*.}\": $VE,?$" "$1" || true)
		if [[ -n "$CI" ]]; then
			echo "---" # Bracket message containing newlines for better visibility in GH's logs.
			echo "::error file=${1#$BASE/},line=${LINE%%:*}::Version mismatch, expected $3 but found $VER!%0AYou might use \`tools/project-version.sh -f -u $VERSION $SLUG\` or \`tools/fixup-project-versions.sh\` to fix this."
			echo "---"
		else
			error "${1#$BASE/}:${LINE%%:*}: Version mismatch, expected $3 but found $VER!"
			FIXHINT=true
		fi
	fi
}

# Make a semver version from a possible WordPress-style version.
SEMVERSION=$(sed -E 's/^([0-9]+\.[0-9]+)([-+]|$)/\1.0\2/' <<<"$VERSION")

# Update the WordPress plugin header version, if applicable
if [[ "$SLUG" == plugins/* ]]; then
	debug "$OPING WordPress plugin header version"
	PLUGIN_DIR="$BASE/projects/$SLUG"
	find_plugin_file
	sedver "$PLUGIN_FILE" '^( \* Version: )(.+)($)' "$VERSION" 'a WordPress plugin header version'
fi

# Update version in composer.json and package.json
for FILE in "$BASE/projects/$SLUG/composer.json" "$BASE/projects/$SLUG/package.json"; do
	if [[ -f "$FILE" ]]; then
		debug "$OPING version in ${FILE##*/}, if any"
		jsver "$FILE" '.version' "$SEMVERSION"
	fi
done

# Update branch-alias in composer.json
FILE="$BASE/projects/$SLUG/composer.json"
debug "$OPING branch-alias version, if any"
jsver "$FILE" '.extra["branch-alias"]["dev-trunk"]' "$(sed -E 's/\.[0-9]+([-+].*)?$/.x-dev/' <<<"$SEMVERSION")"

# Update autoloader-suffix in composer.json
FILE="$BASE/projects/$SLUG/composer.json"
debug "$OPING autoloader-suffix version, if any"
SUFFIX="$(jq -r '.config["autoloader-suffix"] // "" | split("ⓥ") | if length >= 2 then .[0] else "" end' "$FILE")"
if [[ -n "$SUFFIX" ]]; then
	jsver "$FILE" '.config["autoloader-suffix"]' "${SUFFIX}ⓥ$(sed -E 's/[^a-zA-Z0-9_]/_/g' <<<"$VERSION")"
fi

# Update declared constants
FILE="$BASE/projects/$SLUG/composer.json"
while IFS=" " read -r C F; do
	debug "$OPING version constant $C in $F"
	CE=$(sed 's/[.\[\]\\*^$\/()+?{}|]/\\&/g' <<<"${C}")

	if [[ ! -f "$BASE/projects/$SLUG/$F" ]]; then
		EXIT=1
		if [[ -n "$CI" ]]; then
			LINE=$(grep --line-number --max-count=1 "^	{3}\"$CE\": \".+\",?\$" "$FILE")
			echo "::error file=projects/$SLUG/composer.json,line=${LINE%%:*}::File projects/$SLUG/$F does not exist, cannot $OP version constant $C."
		else
			error "File projects/$SLUG/$F does not exist, cannot $OP version constant $C."
		fi
		continue
	fi

	if [[ "$C" =~ ^:: ]]; then
		PAT="^([[:blank:]]*const ${CE#::}[[:blank:]]+=[[:blank:]]+')([^']*)(';)$"
	else
		PAT="^([[:blank:]]*define\( '$CE', ')([^']*)(' \);)$"
	fi
	sedver "$BASE/projects/$SLUG/$F" "$PAT" "$VERSION" "version constant $C"
done < <(jq -r '.extra["version-constants"] // {} | to_entries | .[] | .key + " " + .value' "$FILE")

# Update other dependencies

if $FIX_INTRA_MONOREPO_DEPS; then
	debug "checking and fixing any broken version dependencies"
	"$BASE/tools/check-intra-monorepo-deps.sh" -u -a
fi

if $FIXHINT; then
	green "You might use \`tools/project-version.sh -f -u $VERSION $SLUG\` or \`tools/fixup-project-versions.sh\` to fix this."
fi

exit $EXIT
