#!/usr/bin/env bash
# shellcheck disable=SC1091

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/version-compare.sh"
. "$BASE/tools/includes/normalize-version.sh"
. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/send_tracks_event.sh"

VERSION_REGEX='^[0-9]+(\.[0-9]+)+(-.*)?$'
CUR_STEP=0

RELEASE_STEPS=(
	'do_trunk_and_prelease_branch_prep'
	'do_changelogs'
	'do_readme'
	'do_commit_changelog_and_readme'
	'do_push_and_build'
	'do_packagist_check'
	'do_create_release_branches'
	'do_create_prerelease_PR'
	'do_final_instructions'
)

# Instructions
function usage {
	cat <<-EOH
		Usage:
		    $0 [-s <step>] <plugin> [<version>] [<plugin> [<version>] ...]

		Options:
		    -h, --help                 Show this help message.
		    -s <step>, --step <step>   Start at a given step.
		    <plugin>                   Plugin name to release (e.g. jetpack)
		    <version>                  Version number (defaults to next stable)

		Conduct a full release of specified plugins through release branch creation.
		Accepts the plugin name without a prefix, such as 'jetpack' or 'backup'. The
		version is optional; if not specified it will be set to the next stable version.

	EOH
	exit 1
}

handle_exit() {
	local exit_code=$?
	local PAYLOAD="$(
		jq -n \
			--arg exit_code "$exit_code" \
			--arg step "$CUR_STEP" \
			'{"exit_code": $exit_code, "step": $step }'
	)"
	send_tracks_event "jetpack_release_exit" "$PAYLOAD"
}

# Preliminary environment checks.
function preflight_checks {
	# Make sure the GitHub CLI is installed.
	if ! command -v gh &> /dev/null; then
		yellow "This tool requires the GitHub CLI, which was not found."
		if command -v brew &> /dev/null; then
			proceed_p "Install the GitHub CLI via brew?" "" Y
			brew install gh
		else
			die "Please install the GitHub CLI before proceeding"
		fi
	fi

	GH_VER="$( gh --version | grep -E -o -m1 '[0-9]+\.[0-9]+\.[0-9]+' )"
	if ! version_compare "$GH_VER" "2.21.2"; then
		command -v brew &> /dev/null && WITH=" with 'brew upgrade gh'" || WITH=
		die "Your version of the GH CLI is out of date. Please upgrade your version$WITH and start again"
	fi

	# Make sure we're signed into the GitHub CLI.
	if ! gh auth status --hostname github.com &> /dev/null; then
		yellow "You are not signed into the GitHub CLI."
		proceed_p "Sign in to the GitHub CLI?" "" Y
		gh auth login
	fi
}

function verify_prerelease_branch {
	[[ $(git branch --show-current) != "prerelease" ]] && die 'Not on prerelease branch!'
	return 0
}

function normalize_plugin_name {
	SLUG="$1"

	# Normalize slug
	SLUG="${SLUG#projects/}" # Remove leading 'projects/'
	SLUG="${SLUG#plugins/}" # Remove leading 'plugins/'
	SLUG="${SLUG%/}" # Remove trailing slash
	SLUG="plugins/$SLUG" # Add leading 'plugins/'
	if [[ ! -e "$BASE/projects/$SLUG/composer.json" ]]; then
		die "$SLUG isn't a valid project!"
	elif ! jq -e '.extra["release-branch-prefix"]' "$BASE/projects/$SLUG/composer.json" &>/dev/null; then
		die "$SLUG has no release branch prefix!"
	fi
	echo "$SLUG"
}

# Generates a command that can be used to resume the release script from the current step.
# Currently unused.
function generate_resume_command() {
	local cmd="$0 -s $CUR_STEP"
	for PLUGIN in "${!PROJECTS[@]}"; do
		cmd+=" ${PLUGIN#plugins/} ${PROJECTS[$PLUGIN]}"
	done
	echo "$cmd"
}

function do_trunk_and_prelease_branch_prep() {
	# Make sure we're standing on trunk and working directory is clean
	CURRENT_BRANCH="$( git rev-parse --abbrev-ref HEAD )"
	if [[ "$CURRENT_BRANCH" != "trunk" ]]; then
		proceed_p "Not currently checked out to trunk." "Check out trunk before continuing?" Y
		git checkout trunk && git pull
	fi

	if [[ -n "$(git status --porcelain)" ]]; then
		die "Working directory not clean, make sure you're working from a clean checkout and try again."
	fi

	yellow "Installing root packages."
	pnpm jetpack install --root

	yellow "Checking out prerelease branch."
	# Is there an upstream prerelease branch already?
	R=$( git ls-remote --heads origin prerelease )
	if [[ -n "$R" ]]; then
		error "There's an existing prerelease branch on GitHub!"
		R=${R%%[ $'\t']*}
		TMP=$( gh pr list --head=prerelease --state=open --json number,author,url,createdAt,title --jq '.[] | "\( .url ) - \( .createdAt | fromdateiso8601 | strftime( "%F %H:%IZ" ) ) - \( .title ) [\( .author.name )]"' )
		if [[ -n "$TMP" ]]; then
			echo "Someone probably needs to merge the following PR:"
			echo "$TMP"
			exit 1
		fi
		git fetch -q origin trunk "$R" || die "Something unexpected went wrong fetching the commit from GitHub"
		if git diff --quiet origin/trunk..."$R"; then
			echo "There don't seem to be any changes between that and trunk. If its author has abandoned the release it should be safe to delete the branch."
			exit 1
		fi
		if ! git diff --quiet origin/trunk..."$R" '*/CHANGELOG.md'; then
			echo "Looks like someone is in the middle of a release! Wait for them to merge the changes back into trunk."
			exit 1
		fi
		echo "Looks like someone may be in the middle of a release! Wait for them to merge the changes back into trunk, or to abandon the release."
		exit 1
	fi

	# Check out and push pre-release branch
	if git rev-parse --verify prerelease &>/dev/null; then
		proceed_p "Existing local prerelease branch found." "Delete it?" Y
		git branch -D prerelease
	fi

	git checkout -b prerelease
	if ! git push -u origin HEAD; then
		send_tracks_event "jetpack_release_prerelease_push" '{"result": "failure"}'
		die "Branch push failed. Check #jetpack-releases and make sure no one is doing a release already, then delete the branch at https://github.com/Automattic/jetpack/branches"
	fi
	send_tracks_event "jetpack_release_prerelease_push" '{"result": "success"}'
}

function do_changelogs {
	verify_prerelease_branch
	# Loop through the projects and update the changelogs after building the arguments.
	for PLUGIN in "${!PROJECTS[@]}"; do
		yellow "Updating the changelog files for $PLUGIN."

		# Add the PR numbers to the changelog.
		ARGS=('-p')

		# Add alpha and beta flags.
		VERSION="${PROJECTS[$PLUGIN]}"
		case $VERSION in
			*-a* ) ARGS+=('-a');;
			*-beta ) ARGS+=('-b');;
		esac

		# Explicitly pass the version number we want so there are no surprises.
		ARGS+=( '-r' "${PROJECTS[$PLUGIN]}" )
		ARGS+=("$PLUGIN");
		tools/changelogger-release.sh "${ARGS[@]}"
	done

	# When it completes, wait for user to edit anything they want, then push key to continue.
	read -r -s -p $'Edit and save all the changelog entries you want in a separate terminal or in your text editor of choice.\nCheck for consistency between the different entries, and keep in mind that your plugin changelog will be used in the plugin readme file.\n\nOnce you are happy with your work, press enter to continue the release process.'
	echo ""
}

function do_readme {
	verify_prerelease_branch
	for PLUGIN in "${!PROJECTS[@]}"; do
		# check if the plugin even has a readme.txt file.
		if [[ ! -e "$BASE/projects/$PLUGIN/readme.txt" ]]; then
			yellow "$PLUGIN has no readme.txt file, skipping."
			continue
		fi
		yellow "Updating the readme.txt file for $PLUGIN."
		ARGS=()
		# Add alpha and beta flags.
		VERSION="${PROJECTS[$PLUGIN]}"
		case $VERSION in
			*-a* ) ARGS+=('-a');;
			*-beta ) ARGS+=('-b');;
			* ) ARGS+=('-s');;
		esac
		pnpm jetpack release "$PLUGIN" readme "${ARGS[@]}"
	done
}

function do_commit_changelog_and_readme {
	verify_prerelease_branch
	yellow "Committing changes."
	git add --all
	git commit -am "Changelog and readme.txt edits."

	# If we're releasing Jetpack and it's a beta, amend the readme.txt
	if [[ -v PROJECTS["plugins/jetpack"] && "${PROJECTS[plugins/jetpack]}" == *-beta ]]; then
		yellow "Releasing a beta for Jetpack, amending the readme.txt"
		pnpm jetpack changelog squash plugins/jetpack readme
		git commit -am "Amend readme.txt"
	fi
}

function do_push_and_build {
	verify_prerelease_branch
	HEADSHA=$(git rev-parse HEAD)
	yellow "Pushing changes."
	git push -u origin prerelease

	yellow "Waiting for build to complete and push to mirror repos"
	BUILDID=

	# If the build ID doesn't exist, try every five seconds until timeout after a minute.
	TIMEOUT=$((SECONDS+60))
	while [[ $SECONDS -lt $TIMEOUT &&  -z "$BUILDID" ]]; do
		echo "Waiting for build to become available..."
		sleep 5
		BUILDID="$( gh run list -b prerelease -w Build --json event,databaseId,headSha | jq --arg HEADSHA "$HEADSHA" '.[] | select(.event=="push" and .headSha==$HEADSHA) | .databaseId' )"
	done

	if [[ -z "$BUILDID" ]]; then
		send_tracks_event "jetpack_release_github_build" '{"result": "not_found"}'
		die "Build ID not found. Check GitHub actions to see if build on prerelease branch is running, then continue with manual steps."
	fi

	yellow "Build ID found, waiting for build to complete and push to mirror repos."
	if ! gh run watch "${BUILDID[0]}" --exit-status; then
		send_tracks_event "jetpack_release_github_build" '{"result": "failure"}'
		die "Build failed! Check for build errors on GitHub for more information."
	fi

	send_tracks_event "jetpack_release_github_build" '{"result": "success"}'
	yellow "Build is complete."
}

function do_packagist_check {
	verify_prerelease_branch
	# Wait for new versions of any composer packages to be up.
	# We expect a new version when (1) the package is touched in this release and (2) it has no change entry files remaining.
	POLL_ARGS=()
	cd "$BASE"
	GITBASE=$(git merge-base origin/trunk HEAD)
	for PKGDIR in $(git -c core.quotepath=off diff --name-only "$GITBASE..HEAD" projects/packages/ | sed 's!^\(projects/packages/[^/]*\)/.*!\1!' | sort -u); do
		cd "$BASE/$PKGDIR"
		CHANGES_DIR=$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)
		if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]] && jq -e '.extra["mirror-repo"] // null' composer.json &>/dev/null; then
			POLL_ARGS+=( "$( jq -r .name composer.json )=$( changelogger version current )" )
		fi
	done
	cd "$BASE"
	if [[ ${#POLL_ARGS[@]} -gt 0 ]]; then
		yellow "Waiting for packagist to get updated packages..."
		tools/js-tools/await-packagist-updates.mjs "${POLL_ARGS[@]}"
		yellow "Packagist is updated!"
	fi
}

function do_create_release_branches {
	# Run tools/create-release-branch.sh to create a release branch for each project.
	for PREFIX in "${PREFIXES[@]}"; do
		git checkout prerelease
		PROJECT=$(jq -r --arg prefix "$PREFIX" '.[$prefix] | if length == 1 then "plugins/\(first)" else empty end' <<<"$PREFIXDATA")
		if [[ -n "$PROJECT" && -n "${PROJECTS[$PROJECT]}" ]]; then
			VERSION="${PROJECTS[$PROJECT]}"
			yellow "Creating release branch for $PROJECT $VERSION"
			tools/create-release-branch.sh "$PROJECT" "$VERSION"
		else
			yellow "Creating release branch for $PREFIX"
			tools/create-release-branch.sh "$PREFIX"
		fi
	done

	yellow "Release branches created!"
}

function do_create_prerelease_PR {
	yellow "Creating a PR to merge the prerelease branch into trunk."
	git checkout prerelease

	# Handle any package changes merged into trunk while we were working.
	git fetch
	git merge origin/trunk
	tools/fixup-project-versions.sh
	if [[ -n "$(git status --porcelain)" ]]; then
		git commit -am 'Version bumps'
	fi
	git push
	PLUGINS_CHANGED=
	for PLUGIN in "${!PROJECTS[@]}"; do
		PLUGINS_CHANGED+="$(basename "$PLUGIN") ${PROJECTS[$PLUGIN]}, "
	done
	# Remove the trailing comma and space
	PLUGINS_CHANGED=${PLUGINS_CHANGED%, }
	sed "s/%RELEASED_PLUGINS%/$PLUGINS_CHANGED/g" .github/files/BACKPORT_RELEASE_CHANGES.md > .github/files/TEMP_BACKPORT_RELEASE_CHANGES.md
	gh pr create --title "Backport $PLUGINS_CHANGED Changes" --body "$(cat .github/files/TEMP_BACKPORT_RELEASE_CHANGES.md)" --label "[Status] Needs Review" --label "[Type] Janitorial" --repo "Automattic/jetpack" --head "$(git rev-parse --abbrev-ref HEAD)"
	rm .github/files/TEMP_BACKPORT_RELEASE_CHANGES.md
}

function do_final_instructions {
	yellow "Release script complete!"

	echo ''
	echo 'Next you need to merge the above PR into trunk.'

	AUTO=()
	MANUALTAG=()
	MANUALTAGONLY=()
	MANUALPUB=()
	MANUALBOTH=()
	for PLUGIN in "${!PROJECTS[@]}"; do
		F="$BASE/projects/$PLUGIN/composer.json"
		if ! jq -e '.extra["mirror-repo"] // false' "$F" &>/dev/null; then
			continue
		fi

		if ! jq -e '.extra["wp-plugin-slug"] // .extra["wp-theme-slug"] // false' "$F" &>/dev/null; then
			if ! jq -e '.extra["autotagger"]' "$F" &>/dev/null; then
				MANUALTAGONLY+=( "$PLUGIN" )
			fi
			continue
		fi

		if jq -e '.extra["autotagger"]' "$F" &>/dev/null; then
			if jq -e '.extra["wp-svn-autopublish"] // false' "$F" &>/dev/null; then
				AUTO+=( "$PLUGIN" )
			else
				MANUALPUB+=( "$PLUGIN" )
			fi
		else
			if jq -e '.extra["wp-svn-autopublish"] // false' "$F" &>/dev/null; then
				MANUALTAG+=( "$PLUGIN" )
			else
				MANUALBOTH+=( "$PLUGIN" )
			fi
		fi
	done

	if [[ ${#AUTO[@]} -gt 0 ]]; then
		cat <<-EOM

		For these plugins: ${AUTO[*]}
		The release will shortly be tagged to GitHub and released to SVN and you can
		then smoke test the release. Once ready, use \`./tools/stable-tag.sh <plugin>\`
		to update the stable tag, and you're done!
		EOM
	fi

	if [[ ${#MANUALTAGONLY[@]} -gt 0 ]]; then
		cat <<-EOM

		For these plugins: ${MANUALTAGONLY[*]}
		Wait for the changes to appear in the mirror repo and conduct a GitHub
		release. Then you're done!
		EOM
	fi

	if [[ ${#MANUALTAG[@]} -gt 0 ]]; then
		cat <<-EOM

		For these plugins: ${MANUALTAG[*]}
		Wait for the changes to appear in the mirror repo and conduct a GitHub
		release. The changes will then be automatically released to SVN and you can
		then smote test the release. Once ready, use \`./tools/stable-tag.sh <plugin>\`
		to update the stable tag, and you're done!
		EOM
	fi

	if [[ ${#MANUALPUB[@]} -gt 0 ]]; then
		cat <<-EOM

		For these plugins: ${MANUALPUB[*]}
		The release will shortly be tagged to GitHub. Once the tag appears, deploy it
		to SVN by running \`./tools/deploy-to-svn.sh <plugin> <tag>\`, and smoke test.
		When ready, flip the stable tag with \`./tools/stable-tag.sh <plugin>\` and
		you're all set.
		EOM
	fi

	if [[ ${#MANUALBOTH[@]} -gt 0 ]]; then
		cat <<-EOM

		For these plugins: ${MANUALBOTH[*]}
		Wait for the changes to appear in the mirror repo, and conduct a GitHub
		release. Next, deploy the tag to SVN by running
		\`./tools/deploy-to-svn.sh <plugin> <tag>\`, and smoke test. When ready, flip
		the stable tag with \`./tools/stable-tag.sh <plugin>\` and you're all set.
		EOM
	fi
}

trap 'exit 130' SIGINT
trap 'exit 143' SIGTERM
trap 'handle_exit' EXIT

preflight_checks

# No args, help flag, or invalid flag, so show usage.
if [[ $# -eq 0 || $1 == '-h' || $1 == '--help' ]]; then
	usage
elif [[ $1 == '-s' || $1 == '--step' ]]; then
	if [[ $2 =~ ^[0-9]$ ]]; then
		CUR_STEP="$2"
		shift 2
	else
		usage
	fi
elif [[ $1 == '--list-steps' ]]; then
	echo 'Use the following steps at your own risk:'
	for i in "${!RELEASE_STEPS[@]}"; do
		echo "  $i: ${RELEASE_STEPS[$i]}"
	done
	exit 1
fi

# Parse arguments in associated array of plugin => version format.
declare -A PROJECTS
while [[ $# -gt 0 ]]; do
	# Grab plugin name
	PLUGIN=$(normalize_plugin_name "$1")
	shift

	# Grab version number if provided.
	if [[ "$1" =~ $VERSION_REGEX ]]; then
		VERSION=$1
		shift
	else
		cd "$BASE/projects/$PLUGIN"
		VERSION=$(changelogger version next) || die "Cannot determine version number for $PLUGIN. Please supply one on the command line."
	fi

	PROJECTS["$PLUGIN"]="$VERSION"
done
cd "$BASE"

for PLUGIN in "${!PROJECTS[@]}"; do
	normalize_version_number "${PROJECTS[$PLUGIN]}"
	if [[ ! "$NORMALIZED_VERSION" =~ $VERSION_REGEX ]]; then
		red "\"$NORMALIZED_VERSION\" does not appear to be a valid version number."
		die "Please specify a valid version number."
	fi
	CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$PLUGIN")
	# shellcheck disable=SC2310
	if version_compare "$CUR_VERSION" "$NORMALIZED_VERSION"; then
		proceed_p "$PLUGIN: Version $NORMALIZED_VERSION is not higher than $CUR_VERSION." || die "User aborted script."
	fi
	echo "$PLUGIN: $CUR_VERSION -> ${PROJECTS[$PLUGIN]}"
done

proceed_p "" "Proceed releasing above projects?" Y

# Sending tracking event
RELEASED_PLUGINS="{}"
for PLUGIN in "${!PROJECTS[@]}"; do

	CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$PLUGIN")
	VERSION_DIFF=$( version_diff "$CUR_VERSION" "${PROJECTS[$PLUGIN]}" )

	if [[ "${PROJECTS[$PLUGIN]}" == *-* ]]; then

		# The version is a prerelease.
		if proceed_p "" "Is this $PLUGIN release fixing a known problem caused by a previous release?" N; then
			VERSION_DIFF="bugfix"
		fi

	elif [[ "${PROJECTS[$PLUGIN]}" =~ ^[0-9]+\.[0-9]+\.[0.]*[1-9] ]]; then

		# The version in patch-level.
		VERSION_DIFF="bugfix"

		# If a project follows semver versioning, we prompt.
		if jq -e '.extra.changelogger["versioning"] == "semver"' "$BASE/projects/$PLUGIN/composer.json" &>/dev/null; then
			if ! proceed_p "" "Is this $PLUGIN release fixing a known problem caused by a previous release?" N; then
				VERSION_DIFF="patch"
			fi
		fi
	fi

	RELEASED_PLUGINS=$(
		jq \
			--arg property "${PLUGIN//[\/-]/_}_release_type" \
			--arg value "$VERSION_DIFF" \
			'.[ $property ] = $value' <<< "$RELEASED_PLUGINS"
	)
	RELEASED_PLUGINS=$(
		jq \
			--arg property "${PLUGIN//[\/-]/_}_version" \
			--arg value "${PROJECTS[$PLUGIN]}" \
			'.[ $property ] = $value' <<< "$RELEASED_PLUGINS"
	)
done

send_tracks_event "jetpack_release_start" "$RELEASED_PLUGINS"

# Figure out which release branch prefixes to use.
PREFIXDATA=$(jq -n 'reduce inputs as $in ({}; .[ $in.extra["release-branch-prefix"] | if . == null then empty elif type == "array" then .[] else . end ] += [ input_filename | capture( "projects/plugins/(?<p>[^/]+)/composer\\.json$" ).p ] ) | to_entries | sort_by( ( .value | -length ), .key ) | from_entries' "$BASE"/projects/plugins/*/composer.json)
TMP=$(jq -rn --argjson d "$PREFIXDATA" '$d | reduce to_entries[] as $p ({ s: ( $ARGS.positional | map( sub( "^plugins/"; "" ) ) ), o: []}; if $p.value - .s == [] then .o += [ $p.key ] | .s -= $p.value else . end) | .o[]' --args "${!PROJECTS[@]}")
mapfile -t PREFIXES <<<"$TMP"
[[ ${#PREFIXES[@]} -eq 0 ]] && die "Could not determine prefixes for projects ${!PROJECTS[*]}"
if [[ ${#PREFIXES[@]} -gt 1 ]]; then
	yellow "The specified set of plugins will require multiple release branches: ${PREFIXES[*]}"
	proceed_p "" "" Y
fi

# Run each release step.
for ((i = CUR_STEP; i < ${#RELEASE_STEPS[@]}; i++)); do
	green "Step $i: ${RELEASE_STEPS[$i]}"
	"${RELEASE_STEPS[$i]}"
	((CUR_STEP+=1))
done
