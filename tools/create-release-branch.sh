#!/usr/bin/env bash

set -eo pipefail
shopt -s inherit_errexit

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/alpha-tag.sh"
. "$BASE/tools/includes/normalize-version.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/version-compare.sh"

# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <prefix|plugin> [<version>]

		Create a new release branch for the specified prefix or plugin.
		The <prefix|plugin> should be a release branch prefix used by at least one
		monorepo plugin, but may also be the name of a directory in projects/plugins/
		or a path to a plugin directory or file.

		If no <version> is specified (and we're not non-interactive), you will be
		prompted. You'll also be prompted if more than one plugin matches the prefix.

		Options:
		  --non-interactive  Exit instead of prompting for questionable cases.
	EOH
	exit 1
}

# Run a command and check if output is empty/non-empty
function isnotempty {
	local TMP
	TMP=$("$@") || exit $?
	[[ -n "$TMP" ]]
}

# Process args.
ARGS=()
INTERACTIVE=true
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		--non-interactive)
			INTERACTIVE=false
			;;
		--help)
			usage
			;;
		*)
			ARGS+=( "$arg" )
			;;
	esac
done

if $INTERACTIVE && [[ ! -t 0 ]]; then
	debug "Input is not a terminal, forcing --non-interactive."
	INTERACTIVE=false
fi
if [[ ${#ARGS[@]} -ne 1 && ${#ARGS[@]} -ne 2 ]]; then
	usage
fi

# Collect available prefixes
declare -A PREFIXES
TMP=$(jq -r '.extra["release-branch-prefix"] // empty | if type == "array" then .[] else . end | [ ., input_filename ] | @tsv' "$BASE"/projects/plugins/*/composer.json)
while IFS=$'\t' read -r prefix file; do
	PREFIXES[$prefix]="${PREFIXES[$prefix]:+${PREFIXES[$prefix]}$'\n'}${file%/composer.json}"
done <<<"$TMP"

# If <prefix|plugin> is a known prefix, use the corresponding plugins. Otherwise, process it as a plugin arg.
if [[ -n "${PREFIXES[${ARGS[0]}]}" ]]; then
	PREFIX=${ARGS[0]}
	mapfile -t DIRS <<<"${PREFIXES[$PREFIX]}"
else
	process_plugin_arg "${ARGS[0]}"
	PLUGIN_NAME=$(jq --arg n "${ARGS[0]}" -r '.name // $n' "$PLUGIN_DIR/composer.json")
	PREFIX=$(jq -r '.extra["release-branch-prefix"] // "" | if type == "array" then .[0] else . end' "$PLUGIN_DIR/composer.json")
	if [[ -z "$PREFIX" ]]; then
		die "Plugin $PLUGIN_NAME does not have any release branch prefixes defined in composer.json. Aborting."
	fi
	DIRS=( "$PLUGIN_DIR" )

	if [[ "${PREFIXES[$PREFIX]}" == *$'\n'* ]]; then
		info "Plugin $PLUGIN_NAME uses prefix $PREFIX, which is used in multiple plugins:"
		echo "   ${PREFIXES[$PREFIX]//$'\n'/$'\n   '}"
		proceed_p '' 'Release all these plugins?' Y
		mapfile -t DIRS <<<"${PREFIXES[$PREFIX]}"
	fi
fi

NAMES=()
MIRRORS=()
for DIR in "${DIRS[@]}"; do
	NAMES+=( "$(jq --arg n "${DIR##*/}" -r '.name // $n' "$DIR/composer.json")" )
	TMP=$(jq -r '.extra["mirror-repo"] // ""' "$DIR/composer.json")
	if [[ -n "$TMP" ]]; then
		MIRRORS+=( "$TMP" )
	fi
done
info "Releasing plugins: ${NAMES[*]}"

info "Checking working directory status..."
# shellcheck disable=SC2310
if isnotempty git status --porcelain; then
	die "Working directory is not clean. Aborting."
fi

# Make sure we're on the prerelease branch, or at least that the user is fine with it.
git fetch
TMP=$(git rev-parse --abbrev-ref HEAD)
if [[ "$TMP" != "prerelease" ]]; then
	# shellcheck disable=SC2310
	if proceed_p "Current branch is $TMP." "Check out prerelease branch?"; then
		git checkout prerelease
	else
		proceed_p " " "Continue anyway?"
	fi
fi
COMMITS=$(git log HEAD.. --oneline)
if [[ -n "$COMMITS" ]]; then
	TMP=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}')
	info "The current branch is behind $TMP."
	echo "$COMMITS"
	# shellcheck disable=SC2310
	if proceed_p "" "Pull?" Y; then
		git pull
	else
		proceed_p " " "Continue anyway?"
	fi
fi

# Figure out the version(s) to use for the plugin(s).
function check_ver {
	normalize_version_number "$1"
	if [[ ! "$NORMALIZED_VERSION" =~ ^[0-9]+(\.[0-9]+)+(-.*)?$ ]]; then
		red "\"$NORMALIZED_VERSION\" does not appear to be a valid version number."
		return 1
	fi
	local CUR_VERSION
	CUR_VERSION=$("$BASE/tools/plugin-version.sh" "${DIRS[$2]}")
	# shellcheck disable=SC2310
	if version_compare "$CUR_VERSION" "$NORMALIZED_VERSION" 1; then
		proceed_p "Version $NORMALIZED_VERSION < $CUR_VERSION."
		return $?
	fi
	return 0
}
VERSIONS=()
if [[ -n "${ARGS[1]}" && ${#DIRS[@]} -gt 1 ]]; then
	debug "Ignoring specified version since more than one plugin matches."
	ARGS[1]=
fi
if [[ -n "${ARGS[1]}" ]]; then
	# Check the version.
	check_ver "${ARGS[1]}" 0
	info "Using version number $NORMALIZED_VERSION for plugin ${NAMES[0]}"
	VERSIONS+=( "$NORMALIZED_VERSION" )
else
	# Prompt for versions.
	$INTERACTIVE || die "Cannot prompt for versions when running in non-interactive mode!"
	for ((i=0; i < ${#DIRS[@]}; i++)); do
		cd "${DIRS[$i]}"

		CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
		if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
			PRERELEASE=$(alpha_tag composer.json 0)
			VER=$(changelogger version next --default-first-version --prerelease="$PRERELEASE") || die "$VER"
		else
			VER=$(changelogger version current --default-first-version) || die "$VER"
		fi

		PROMPT="Version to use for plugin ${NAMES[$i]}:"
		# shellcheck disable=SC2310
		if color_supported; then
			PROMPT=$(FORCE_COLOR=1 prompt "$PROMPT")
		fi
		while [[ ${#VERSIONS[@]} -le $i ]]; do
			IFS= read -e -i "$VER" -p "$PROMPT " -r LINE || die "Aborting!"
			[[ -z "$LINE" ]] && LINE=$VER
			# shellcheck disable=SC2310
			if [[ -n "$LINE" ]] && check_ver "$LINE" "$i"; then
				VERSIONS+=( "$NORMALIZED_VERSION" )
			fi
		done
	done
	cd "$BASE"
fi

# Figure out the release branch, and see if it already exists.
# - If there's just one plugin using this prefix, just use the version.
# - Else if the prefix matches a plugin dir name, use that plugin's version.
# - Else ask.
if [[ "${PREFIXES[$PREFIX]}" != *$'\n'* ]]; then
	BRANCH="$PREFIX/branch-${VERSIONS[0]%%-*}"
else
	BRANCH=
	for ((i=0; i < ${#DIRS[@]}; i++)); do
		if [[ "${DIRS[$i]}" == "$BASE/projects/plugins/$PREFIX" ]]; then
			TMP="${VERSIONS[$i]}"
			BRANCH="$PREFIX/branch-${TMP%%-*}"
		fi
	done
	# If that didn't work, ask.
	if [[ -z "$BRANCH" ]]; then
		PROMPT="Version (or other string) to use for the release branch name:"
		# shellcheck disable=SC2310
		if color_supported; then
			PROMPT=$(FORCE_COLOR=1 prompt "$PROMPT")
		fi
		while [[ -z "$BRANCH" ]]; do
			IFS= read -e -i "$(date +%F)" -p "$PROMPT " -r LINE || die "Aborting!"
			if [[ -n "$LINE" ]]; then
				BRANCH="$PREFIX/branch-$LINE"
			fi
		done
	fi
fi
# shellcheck disable=SC2310
if isnotempty git ls-remote --heads origin "$BRANCH"; then
	die "Release branch $BRANCH has already been pushed. Aborting."
elif isnotempty git branch --list "$BRANCH"; then
	proceed_p "Release branch $BRANCH already exists locally, but has not been pushed." "Delete it?" Y
	git branch -D "$BRANCH"
fi

BASE_REF="$(git rev-parse --abbrev-ref HEAD)"
info "Creating release branch $BRANCH based on $BASE_REF..."
git checkout -b "$BRANCH"

for ((i=0; i < ${#DIRS[@]}; i++)); do
	info "Updating version numbers for ${NAMES[$i]}..."
	"$BASE/tools/plugin-version.sh" -v "${VERSIONS[$i]}" "${DIRS[$i]}"
	# shellcheck disable=SC2310
	if isnotempty git status --porcelain; then
		git commit -am "Updated ${NAMES[$i]} version to ${VERSIONS[$i]}"
	else
		debug "No version numbers needed updating."
	fi

	info "Versioning packages for ${NAMES[$i]}..."
	"$BASE/tools/version-packages.sh" "${DIRS[$i]}"
	# shellcheck disable=SC2310
	if isnotempty git status --porcelain; then
		git commit -am "Updated package versions for ${NAMES[$i]}"
	else
		debug "No packages needed versioning."
	fi
done

info <<-EOM
Release branch $BRANCH created! When ready, push to GitHub with

  git push -u origin "$BRANCH"

EOM

PUSH_MSG=" after you push"
if $INTERACTIVE; then
	# shellcheck disable=SC2310
	if proceed_p "" "Check changes and push?" Y; then
		git log -p "$BASE_REF".."$BRANCH" || true
		# shellcheck disable=SC2310
		if proceed_p "" "Push it now?" Y; then
			git push -u origin "$BRANCH"
			PUSH_MSG=
		fi
	fi
	echo ""
fi

if [[ ${#MIRRORS[@]} -eq 1 ]]; then
	MIRROR_MSG="and pushed to ${MIRRORS[0]} when (if) it completes successfully"
elif [[ ${#MIRRORS[@]} -eq 2 ]]; then
	MIRROR_MSG="and pushed to ${MIRRORS[0]} and ${MIRRORS[1]} when (if) it completes successfully"
elif [[ ${#MIRRORS[@]} -gt 2 ]]; then
	MIRRORS[-1]="and ${MIRRORS[-1]}"
	TMP=$( printf ", %s" "${MIRRORS[@]}" )
	MIRROR_MSG="and pushed to ${TMP:2} when (if) it completes successfully"
elif [[ ${#NAMES[@]} -eq 1 ]]; then
	MIRROR_MSG="although no mirror repo is set up for ${NAMES[0]}"
else
	MIRROR_MSG="although no mirror repos are set up for any of these plugins"
fi
fold -s <<-EOM
Remember that the build will be done by GitHub Actions$PUSH_MSG, $MIRROR_MSG. You'll probably want to watch to make sure that happens. This link should list the build jobs for the branch:
EOM
echo "https://github.com/Automattic/jetpack/actions?query=branch%3A$BRANCH+workflow%3ABuild"
