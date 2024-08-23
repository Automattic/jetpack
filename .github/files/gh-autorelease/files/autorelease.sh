#!/bin/bash

set -eo pipefail

: "${GITHUB_REF:?Build argument needs to be set and non-empty.}"
: "${GITHUB_SHA:?Build argument needs to be set and non-empty.}"
: "${API_TOKEN_GITHUB:?Build argument needs to be set and non-empty.}"
: "${GITHUB_API_URL:?Build argument needs to be set and non-empty.}"
: "${GITHUB_REPOSITORY:?Build argument needs to be set and non-empty.}"

if [[ ! -f composer.json ]]; then
	echo '::error::No composer.json. Did it get excluded from the mirror?'
	exit 1
fi

## Determine tag
ROLLING_MODE=
if [[ "$GITHUB_REF" =~ ^refs/tags/v?[0-9]+(\.[0-9]+)+(-[a-z0-9._-]+)?$ ]]; then
	TAG="${GITHUB_REF#refs/tags/}"
elif [[ "$GITHUB_REF" == "refs/heads/trunk" ]]; then
	ROLLING_MODE="$(jq -r '.extra.autorelease.rolling-release' composer.json)"
	if [[ -z "$ROLLING_MODE" ]]; then
		echo "::notice::Skipping trunk release because autorelease rolling mode is not enabled."
		exit 0
	fi
	TAG="rolling-release"
else
	echo "::error::Expected GITHUB_REF like \`refs/tags/v1.2.3\` or \`refs/tags/1.2.3\` or \`trunk\` for rolling releases, got \`$GITHUB_REF\`"
	exit 1
fi

## Check for alphas
if [[ "$TAG" =~ -(alpha|a\.[0-9]*[02468])$ && -z "$ROLLING_MODE" ]]; then
	echo "Not creating a release for alpha version $TAG"
	exit 0
fi
echo "Creating release for $TAG"

## Determine slug and title format.
SLUG="$(jq -r '.extra.autorelease.slug? // .extra["wp-plugin-slug"] // .extra["beta-plugin-slug"] // ( .name | sub( "^.*/"; "" ) )' composer.json)"
if [[ -z "$SLUG" ]]; then
	echo '::error::Failed to get slug from composer.json.'
	exit 1
fi
echo "Using slug $SLUG"

TITLEFMT="$(jq -r '.extra.autorelease.titlefmt? // "%s"' composer.json)"
if [[ "$TITLEFMT" != *"%s"* ]]; then
	echo '::error::Missing or invalid `.extra.autorelease.titlefmt`'
	exit 1
fi
printf -v TITLE "$TITLEFMT" "${TAG#v}"
echo "Creating release \"$TITLE\""

## Create the archive artifact.
echo "::group::Creating $SLUG.zip"
git archive -v --output="$SLUG.zip" --prefix="$SLUG/" HEAD 2>&1
echo "::endgroup::"

if [[ -z "$ROLLING_MODE" ]]; then
	## Create the release note.
	# Extract the changelog section.
	echo "::group::Extracting release notes"
	if [[ ! -f CHANGELOG.md ]]; then
		echo '::endgroup::'
		echo '::error::No CHANGELOG.md for release notes.'
		exit 1
	fi
	SCRIPT="
		/^## \\[?$(sed 's/[.\[\]\\*^$\/()+?{}|]/\\&/g' <<<"${TAG#v}")\\]? - / {
			bc
			:a
			n
			/^## / {
				q
			}
			:c
			s/^## \[([^]]+)\]/## \1/
			p
			ba
		}
	"
	ENTRY=$(sed -n -E -e "$SCRIPT" CHANGELOG.md)
	if [[ -z "$ENTRY" ]]; then
		echo '::endgroup::'
		echo "::error::Failed to find section for ${TAG#v} in CHANGELOG.md"
		exit 1
	fi

	# Strip unwanted sections.
	SCRIPT="
		:a
		/^### .* This section will not be copied to readme\.txt/ {
			:b
			n
			/^#/ ba
			bb
		}
		p
	"
	ENTRY=$(sed -n -E -e "$SCRIPT" <<<"$ENTRY")

	echo "Release notes:"
	echo "-----"
	echo "$ENTRY"
	echo "-----"
	echo "::endgroup::"
else
	## Using a brief explanation for the rolling release note.
	ENTRY="### Rolling release based on the trunk branch."
fi

echo "::group::Creating release"
if ! gh release create "$TAG" \
	--notes "$ENTRY" \
	--target "$GITHUB_SHA" \
	--title "$TITLE"; then
   exit 1
fi

echo "::endgroup::"

echo "::group::Uploading artifact to release"
if ! gh release upload "$TAG" "$SLUG.zip"; then
	exit 1
fi

echo "::endgroup::"
