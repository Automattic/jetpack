#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Print help and exit.
function usage {
	cat <<-'EOH'
		usage: $0 [-v] <slug> <version>

		Replace the `$$next-version$$` token in doc tags with the specified version.
		Recognized patterns:
		 - `@since $$next-version$$`
		 - `@deprecated $$next-version$$`
		 - `@deprecated since $$next-version$$`
	EOH
	exit 1
}

if [[ $# -eq 0 ]]; then
	usage
fi

# Sets options.
VERBOSE=
while getopts ":vh" opt; do
	case ${opt} in
		v)
			if [[ -n "$VERBOSE" ]]; then
				VERBOSE="${VERBOSE}v"
			else
				VERBOSE="-v"
			fi
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
shift "$(($OPTIND - 1))"

if [[ -z "$VERBOSE" ]]; then
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

# Determine the version
[[ -z "$2" ]] && die "A version must be specified."
VERSION="$2"
if ! grep -E -q '^[0-9]+(\.[0-9]+)+(-(a|alpha|beta)([-.]?[0-9]+)?)?$' <<<"$VERSION"; then
	proceed_p "Version $VERSION does not seem to be a valid version number." "Continue?"
fi
VE=$(sed 's/[&\\/]/\\&/g' <<<"$VERSION")

cd "$BASE"
EXIT=0
for FILE in $(git ls-files "projects/$SLUG/"); do
	grep -F -q '$$next-version$$' "$FILE" 2>/dev/null || continue
	debug "Processing $FILE"

	sed -i.bak -E -e 's!(@since|@deprecated( [sS]ince)?) \$\$next-version\$\$!\1 '"$VE"'!g' "$FILE"
	rm "$FILE.bak" # We need a backup file because macOS requires it.

	if grep -F -q '$$next-version$$' "$FILE"; then
		EXIT=1
		while IFS=':' read -r LINE DUMMY; do
			if [[ -n "$CI" ]]; then
				echo "::error file=$FILE,line=$LINE::"'Unexpected `$$next-version$$` token.'
			else
				error "$FILE:$LINE:"' Unexpected `$$next-version$$` token.'
			fi
		done < <( grep --line-number -F '$$next-version$$' "$FILE" || echo "" )
	fi
done

exit $EXIT
