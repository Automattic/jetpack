#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/version-compare.sh"
. "$BASE/tools/includes/normalize-version.sh"
. "$BASE/tools/includes/changelogger.sh"


# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin> [<version>] [<plugin> [<version>] ...]

		Conduct a full release of specified plugins through release branch creation. Just the plugin name is fine, such as 'jetpack' or 'backup.' The version is optional, and if not specified, will be set to the next stable version.

		Options:
			-h Show this help message.
	EOH
	exit 1
}

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

# Get the options passed and parse them.
while getopts "h" opt; do
	case ${opt} in
		h)
			usage
		;;
		?)
			error "Invalid argument"
			echo ""
			usage
		;;
	esac
done
shift "$(($OPTIND -1))"

# Parse arguments in associated array of plugins/project => version format.
if [ $# -eq 0 ]; then
	usage
fi

declare -A PROJECTS
while [[ $# -gt 0 ]]; do
	if [[ "$1" =~ ^[a-zA-Z\-]+$ ]]; then
		PLUGIN=$1
	else
		die "Script must be passed in <project> [version] format. Got $1"
	fi

	if [[ "$2" =~ ^[0-9]+(\.[0-9]+)+(-.*)?$ ]]; then
		PROJECTS["$PLUGIN"]=$2
		SHIFT="2"
	else
		PROJECTS["$PLUGIN"]=''
		SHIFT="1"
	fi
	shift "$SHIFT"
done

# If we're releasing Jetpack, we're also releasing mu-wpcom-plugin.
if [[ -v PROJECTS["jetpack"] && ! -v PROJECTS["mu-wpcom-plugin"] ]]; then
	PROJECTS["mu-wpcom-plugin"]=''
fi

# Check that the projects are valid.
for PLUGIN in "${!PROJECTS[@]}"; do
	# Get the project slug.
	SLUG="${PLUGIN#projects/}" # DWIM
	SLUG="${SLUG%/}" # Sanitize
	SLUG="plugins/$SLUG"
	if [[ ! -e "$BASE/projects/$SLUG/composer.json" ]]; then
		die "$SLUG isn't a valid project!"
	elif ! jq -e '.extra["release-branch-prefix"]' "$BASE/projects/$SLUG/composer.json" &>/dev/null; then
		die "$SLUG has no release branch prefix!"
	else
		PROJECTS["$SLUG"]="${PROJECTS[$PLUGIN]}"
		unset "PROJECTS[$PLUGIN]"
	fi
done

# Try to obtain a version number for plugins that we didn't supply.
for SLUG in "${!PROJECTS[@]}"; do
	if [[ -z "${PROJECTS[$SLUG]}" ]]; then
		cd "$BASE/projects/$SLUG"
		PROJECTS["$SLUG"]=$(changelogger version next)
	fi
done
cd "$BASE"

# Check the plugin version(s) to use for the plugin(s).
function check_ver {
	normalize_version_number "$2"
	if [[ ! "$NORMALIZED_VERSION" =~ ^[0-9]+(\.[0-9]+)+(-.*)?$ ]]; then
		red "\"$NORMALIZED_VERSION\" does not appear to be a valid version number."
		return 1
	fi
	local CUR_VERSION
	CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$1")
	# shellcheck disable=SC2310
	if version_compare "$CUR_VERSION" "$NORMALIZED_VERSION"; then
		proceed_p "Version $NORMALIZED_VERSION <= $CUR_VERSION."
		return $?
	fi
	return 0
}

for PLUGIN in "${!PROJECTS[@]}"; do
	if ! check_ver "$PLUGIN" "${PROJECTS[$PLUGIN]}"; then
		die "Please specify a valid version number."
	fi
	echo "Releasing $PLUGIN ${PROJECTS[$PLUGIN]}"
done

proceed_p "" "Proceed releasing above projects?" Y

# Figure out which release branch prefixes to use.
PREFIXDATA=$(jq -n 'reduce inputs as $in ({}; .[ $in.extra["release-branch-prefix"] | if . == null then empty elif type == "array" then .[] else . end ] += [ input_filename | capture( "projects/plugins/(?<p>[^/]+)/composer\\.json$" ).p ] ) | to_entries | sort_by( ( .value | -length ), .key ) | from_entries' "$BASE"/projects/plugins/*/composer.json)
TMP=$(jq -rn --argjson d "$PREFIXDATA" '$d | reduce to_entries[] as $p ({ s: ( $ARGS.positional | map( sub( "^plugins/"; "" ) ) ), o: []}; if $p.value - .s == [] then .o += [ $p.key ] | .s -= $p.value else . end) | .o[]' --args "${!PROJECTS[@]}")
mapfile -t PREFIXES <<<"$TMP"
[[ ${#PREFIXES[@]} -eq 0 ]] && die "Could not determine prefixes for projects ${!PROJECTS[*]}"
if [[ ${#PREFIXES[@]} -gt 1 ]]; then
	yellow "The specified set of plugins will require multiple release branches: ${PREFIXES[*]}"
	proceed_p "" "" Y
fi

# Make sure we're standing on trunk and working directory is clean
CURRENT_BRANCH="$( git rev-parse --abbrev-ref HEAD )"
if [[ "$CURRENT_BRANCH" != "trunk" ]]; then
	proceed_p "Not currently checked out to trunk." "Check out trunk before continuing?" Y
	git checkout trunk && git pull
fi

if [[ -n "$(git status --porcelain)" ]]; then
	die "Working directory not clean, make sure you're working from a clean checkout and try again."
fi

yellow "Checking out prerelease branch."
# Check out and push pre-release branch
if git rev-parse --verify prerelease &>/dev/null; then
	proceed_p "Existing prerelease branch found." "Delete it?" Y
	git branch -D prerelease
fi

git checkout -b prerelease
if ! git push -u origin HEAD; then
	die "Branch push failed. Check #jetpack-releases and make sure no one is doing a release already, then delete the branch at https://github.com/Automattic/jetpack/branches"
fi
GITBASE=$( git rev-parse --verify HEAD )

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
read -r -s -p $'Edit all the changelog entries you want (in a separate terminal or your text editor of choice (make sure to save)).\nCheck for consistency between the different entries, and keep in mind that your plugin changelog will be used in the plugin readme file.\n\nOnce you are happy with your work, press enter to continue the release process.'
echo ""

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

yellow "Committing changes."
git add --all
git commit -am "Changelog and readme.txt edits."

# If we're releasing Jetpack and it's a beta, amend the readme.txt
if [[ -v PROJECTS["plugins/jetpack"] && "${PROJECTS[plugins/jetpack]}" == *-beta ]]; then
	yellow "Releasing a beta for Jetpack, amending the readme.txt"
	pnpm jetpack changelog squash plugins/jetpack readme
	git commit -am "Amend readme.txt"
fi

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
	die "Build ID not found. Check GitHub actions to see if build on prerelease branch is running, then continue with manual steps."
fi

yellow "Build ID found, waiting for build to complete and push to mirror repos."
if ! gh run watch "${BUILDID[0]}" --exit-status; then
	echo "Build failed! Check for build errors on GitHub for more information." && die
fi

yellow "Build is complete."

# Wait for new versions of any composer packages to be up.
# We expect a new version when (1) the package is touched in this release and (2) it has no change entry files remaining.
POLL_ARGS=()
cd "$BASE"
for PKGDIR in $(git -c core.quotepath=off diff --name-only "$GITBASE..HEAD" projects/packages/ | sed 's!^\(projects/packages/[^/]*\)/.*!\1!' | sort -u); do
	cd "$BASE/$PKGDIR"
	CHANGES_DIR=$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)
	if [[ ! -d "$CHANGES_DIR" || -z "$(ls -- "$CHANGES_DIR")" ]]; then
		POLL_ARGS+=( "$( jq -r .name composer.json )=$( changelogger version current )" )
	fi
done
cd "$BASE"
if [[ ${#POLL_ARGS[@]} -gt 0 ]]; then
	yellow "Waiting for packagist to get updated packages..."
	tools/js-tools/await-packagist-updates.mjs "${POLL_ARGS[@]}"
	yellow "Packagist is updated!"
fi

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

yellow "Creating a PR to merge the prerelease branch into trunk."
git checkout prerelease

# If we're releasing the Jetpack plugin, ask if we want to start a new cycle.
if [[ -v PROJECTS["plugins/jetpack"] ]]; then
  if proceed_p "Do you want to start a new cycle for Jetpack?" "" Y; then
    pnpm jetpack release plugins/jetpack version -a --init-next-cycle
    git add --all
    git commit -am "Init new cycle"
  fi
fi

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
gh pr create --title "Backport $PLUGINS_CHANGED Changes" --body "$(cat .github/files/TEMP_BACKPORT_RELEASE_CHANGES.md)" --label "[Status] Needs Review" --repo "Automattic/jetpack" --head "$(git rev-parse --abbrev-ref HEAD)"
rm .github/files/TEMP_BACKPORT_RELEASE_CHANGES.md

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
