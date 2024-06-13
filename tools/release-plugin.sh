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
		proceed_p "Install the GitHub CLI via brew?"
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
	proceed_p "Sign in to the GitHub CLI?"
	gh auth login
fi


yellow "Creating a PR to merge the prerelease branch into trunk."
git checkout prerelease

# If we're releasing the Jetpack plugin, ask if we want to start a new cycle.
if [[ -v PROJECTS["plugins/jetpack"] ]]; then
  if proceed_p "Do you want to start a new cycle for Jetpack?"; then
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
