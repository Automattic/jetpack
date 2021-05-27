#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-v] [-b] <slug>

		Prepare a release of the specified project and everything it depends on.
		 - Run \`changelogger write\`
		 - Run \`tools/project-version.sh\`

		Pass \`-b\` to prepare a beta release by passing \`--prerelease=beta\` to changelogger.
	EOH
	exit 1
}

if [[ $# -eq 0 ]]; then
	usage
fi

# Sets options.
VERBOSE=
BETA=false
while getopts ":vbh" opt; do
	case ${opt} in
		v)
			if [[ -n "$VERBOSE" ]]; then
				VERBOSE="${VERBOSE}v"
			else
				VERBOSE="-v"
			fi
			;;
		b)
			BETA=true
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

cd "$BASE"
yarn jetpack install --all

DEPS="$(tools/find-project-deps.php)"

# Release a project
#  - $1: Project slug.
#  - $2: Beta flag.
#  - $3: Project that depended on this project.
#  - $4: Indent.
function releaseProject {
	local SLUG="$1"
	local BETA="$2"
	local FROM="$3"
	local I="$4"

	cd "$BASE/projects/$SLUG"
	local CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
	if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]]; then
		if [[ -z "$FROM" ]]; then
			info "Project $SLUG has no changes, skipping."
		else
			debug "${I}Project $SLUG has no changes, skipping."
		fi
		return
	fi

	info "${I}Processing $SLUG..."

	# Find changelogger.
	local CL
	if [[ -x vendor/bin/changelogger ]]; then
		CL=vendor/bin/changelogger
	elif [[ -x bin/changelogger ]]; then
		CL=bin/changelogger
	else
		yellow "${I}No changelogger! Skipping."
		return
	fi

	# Changelogger write.
	local ARGS=( write )
	if [[ -n "$VERBOSE" ]]; then
		ARGS+=( "$VERBOSE" )
	fi
	ARGS+=( "--default-first-version" )
	if $BETA; then
		ARGS+=( "--prerelease=beta" )
	fi
	debug "${I}  $CL ${ARGS[*]}"
	$CL "${ARGS[@]}"

	# Fetch version from changelogger.
	debug "${I}  $CL version current"
	local VER=$($CL version current)

	# Update versions.
	ARGS=()
	if [[ -n "$VERBOSE" ]]; then
		ARGS+=( "$VERBOSE" )
	fi
	ARGS+=( "-u" "$VER" "$SLUG" )
	debug "${I}  tools/project-version.sh ${ARGS[*]}"
	"$BASE"/tools/project-version.sh "${ARGS[@]}"

	# Release deps.
	debug "${I}  Processing dependencies..."
	for D in $(jq --argjson deps "$DEPS" --arg slug "$SLUG" -nr '$deps[$slug] // [] | .[]'); do
		releaseProject "$D" false "$SLUG" "$I  "
	done

	debug "${I}Done processing $SLUG!"
}

releaseProject "$SLUG" "$BETA"

cat <<-EOM

	You can examine the changelogs with

	  git diff '**/CHANGELOG.md'

	Feel free to edit them as needed. Then commit and push a PR, and have it merged.

EOM

if [[ "$SLUG" == plugins/* ]]; then
	cd "$BASE"
	VER=
	if [[ -x "projects/$SLUG/vendor/bin/changelogger" ]]; then
		VER=$(cd "projects/$SLUG" && vendor/bin/changelogger version current)
	elif [[ -x "projects/$SLUG/bin/changelogger" ]]; then
		VER=$(cd "projects/$SLUG" && bin/changelogger version current)
	fi
	if [[ -n "$VER" ]]; then
		cat <<-EOM
			When ready, you can create the release branch with

			  tools/create-release-branch.sh $SLUG ${VER%-beta}

		EOM
	fi
fi
