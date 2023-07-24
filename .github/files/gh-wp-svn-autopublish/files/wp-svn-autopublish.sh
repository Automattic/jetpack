#!/bin/bash

set -eo pipefail

: "${GITHUB_REF:?Build argument needs to be set and non-empty.}"
if [[ -n "$CI" ]]; then
	: "${WPSVN_USERNAME:?Build argument needs to be set and non-empty.}"
	: "${WPSVN_PASSWORD:?Build argument needs to be set and non-empty.}"
fi

## Determine tag
if [[ ! "$GITHUB_REF" =~ ^refs/tags/v?[0-9]+(\.[0-9]+)+(-[a-z0-9._-]+)?$ ]]; then
	echo "::error::Expected GITHUB_REF like \`refs/tags/v1.2.3\` or \`refs/tags/1.2.3\`, got \`$GITHUB_REF\`"
	exit 1
fi
TAG="${GITHUB_REF#refs/tags/}"
TAG="${TAG#v}"

## Determine slug
WPSLUG=$(jq -r '.extra["wp-plugin-slug"] // ""' "src/composer.json")
if [[ -z "$WPSLUG" ]]; then
	echo '::error::Failed to determine plugin slug.'
	exit 1
fi

echo "Publishing $WPSLUG version $TAG"

mkdir svn
cd svn

echo '::group::Checking out SVN (shallowly)'
svn checkout "https://plugins.svn.wordpress.org/$WPSLUG/" --depth=empty .
echo '::endgroup::'

echo '::group::Checking out SVN trunk'
svn up trunk
echo '::endgroup::'

echo "::group::Checking out SVN tags (shallowly)"
svn up tags --depth=immediates
echo '::endgroup::'

if [[ -e "tags/$TAG" ]]; then
	echo "::error::Tag $TAG already exists in SVN. Aborting."
	exit 1
fi

echo "::group::Deleting everything in trunk except for .svn directories"
find trunk ! \( -path '*/.svn/*' -o -path "*/.svn" \) \( ! -type d -o -empty \) -delete
[[ -e trunk ]] || mkdir -p trunk # If there were no .svn directories, trunk itself might have been removed.
echo '::endgroup::'

echo "::group::Copying git repo into trunk"
git clone ../src trunk/
echo '::endgroup::'

echo "::group::Removing .git files and empty directories"
find trunk -name '.git*' -print -exec rm -rf {} +
find trunk -type d -empty -print -delete
echo '::endgroup::'

echo "::group::Adding and removing SVN files"
while IFS=" " read -r FLAG FILE; do
	# The appending of an `@` to the filename here avoids problems with filenames containing `@` being interpreted as "peg revisions".
	if [[ "$FLAG" == '!' ]]; then
		svn rm "${FILE}@"
	elif [[ "$FLAG" == "?" ]]; then
		svn add "${FILE}@"
	fi
done < <( svn status )
echo '::endgroup::'

# Check that the stable tag in trunk/readme.txt is not being changed. If it is, try to undo the change.
CHECK="$(svn diff trunk/readme.txt | grep '^[+-]Stable tag:' || true)"
if [[ -n "$CHECK" ]]; then
	LINE="$(grep --line-number --max-count=1 '^Stable tag:' trunk/readme.txt)"
	if grep -q '^+' <<<"$CHECK" && ! grep -q '^-' <<<"$CHECK"; then
		# On the initial commit, it seems there's no way to specify not to immediately have that commit served as the stable version.
		# So just print a notice pointing that out in case anyone is looking and leave it as-is.
		echo "::notice::This appears to be the initial release of the plugin, which will unavoidably set the stable tag to the version being released now."
	elif [[ -n "$LINE" ]]; then
		echo "::warning::Stable tag must be updated manually! Update would change it, attempting to undo the change.%0A%0A${CHECK/$'\n'/%0A}"
		nl=$'\n'
		patch -R trunk/readme.txt <<<"@@ -${LINE%%:*},1 +${LINE%%:*},1 @@$nl$CHECK"
		CHECK2="$(svn diff trunk/readme.txt | grep '^[+-]Stable tag:' || true)"
		if [[ -n "$CHECK2" ]]; then
			echo "::error::Attempt to revert stable tag change failed! Remaining diff:%0A%0A${CHECK2/$'\n'/%0A}"
			exit 1
		fi
	else
		echo "::error::Stable tag must be updated manually! Update would change it.%0A%0A${CHECK/$'\n'/%0A}"
		exit 1
	fi
fi

if [[ -n "$CI" ]]; then
	echo "::group::Committing to SVN"
	svn commit -m "Update to version $TAG from GitHub" --no-auth-cache --non-interactive  --username "$WPSVN_USERNAME" --password "$WPSVN_PASSWORD"
	echo '::endgroup::'
else
	echo "----"
	echo "Not running in CI, skipping commit"
	echo "  svn commit -m \"Update to version $TAG from GitHub\" --no-auth-cache --non-interactive  --username \"\$WPSVN_USERNAME\" --password \"\$WPSVN_PASSWORD\""
	echo "----"
fi

if [[ -n "$CI" ]]; then
	echo "::group::Creating tag"
	svn cp "^/$WPSLUG/trunk" "^/$WPSLUG/tags/$TAG" --no-auth-cache --non-interactive  --username "$WPSVN_USERNAME" --password "$WPSVN_PASSWORD" -m "Tagging version $TAG"
	echo '::endgroup::'
else
	echo "----"
	echo "Not running in CI, skipping commit"
	echo "  svn cp \"^/$WPSLUG/trunk\" \"^/$WPSLUG/tags/$TAG\" --no-auth-cache --non-interactive  --username \"\$WPSVN_USERNAME\" --password \"\$WPSVN_PASSWORD\" -m \"Tagging version $TAG\""
	echo "----"
fi

# Update the "Stable tag" in the tag if it's not a beta version.
if [[ "$TAG" =~ ^[0-9]+(\.[0-9]+)+$ ]]; then
	if [[ -n "$CI" ]]; then
		echo "::group::Checking out new tag"
		svn up "tags/$TAG"
		echo '::endgroup::'
		sed -i -e "s/^Stable tag: .*/Stable tag: $TAG/" "tags/$TAG/readme.txt"
		echo "::group::Committing to SVN"
		svn commit -m "Updating stable tag in version $TAG" --no-auth-cache --non-interactive  --username "$WPSVN_USERNAME" --password "$WPSVN_PASSWORD"
		echo '::endgroup::'
	else
		echo "----"
		echo "Not running in CI, skipping tag \"Stable tag\" update"
		echo "  svn up \"tags/$TAG\""
		echo "  sed -i -e \"s/^Stable tag: .*/Stable tag: $TAG/\" \"tags/$TAG/readme.txt\""
		echo "  svn commit -m \"Updating stable tag in version $TAG\" --no-auth-cache --non-interactive  --username \"\$WPSVN_USERNAME\" --password \"\$WPSVN_PASSWORD\""
		echo "----"
	fi
else
	echo "This is a prerelease version, not updating \"Stable tag\" in tag."
fi
