#!/bin/bash

set -eo pipefail

: "${GH_TOKEN:?Build argument needs to be set and non-empty.}"
: "${GITHUB_REF:?Build argument needs to be set and non-empty.}"
: "${GITHUB_SHA:?Build argument needs to be set and non-empty.}"

if [[ ! -f composer.json ]]; then
	echo '::error::No composer.json. Did it get excluded from the mirror?'
	exit 1
fi

## Determine tag
ROLLING_MODE=
if [[ "$GITHUB_REF" =~ ^refs/tags/v?[0-9]+(\.[0-9]+)+(-[a-z0-9._-]+)?$ ]]; then
	TAG="${GITHUB_REF#refs/tags/}"

	## Check for alphas
	if [[ "$TAG" =~ -(alpha|a\.[0-9]*[02468])$ ]]; then
		echo "Not creating a release for alpha version $TAG"
		exit 0
	fi
elif [[ "$GITHUB_REF" == "refs/heads/trunk" ]]; then
	if ! jq -e '.extra.autorelease["rolling-release"]? // false' composer.json > /dev/null; then
		echo "::notice::Skipping trunk release because autorelease rolling mode is not enabled."
		exit 0
	fi
	ROLLING_MODE=true
	TAG="rolling-release"
else
	echo "::error::Expected GITHUB_REF like \`refs/tags/v1.2.3\` or \`refs/tags/1.2.3\` or \`trunk\` for rolling releases, got \`$GITHUB_REF\`"
	exit 1
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

if [[ -n "$ROLLING_MODE" ]]; then
	echo "::group::Deleting stale rolling release"
	if gh release view "$TAG" >/dev/null; then
		gh release delete "$TAG" --cleanup-tag -y
	fi
	echo "::endgroup::"
fi


echo "::group::Creating release"
ADDITIONAL_ARGS=()
if [[ -n "$ROLLING_MODE" ]]; then
	ADDITIONAL_ARGS+=( --prerelease )
fi
gh release create "$TAG" \
	"${ADDITIONAL_ARGS[@]}" \
	--notes "$ENTRY" \
	--target "$GITHUB_SHA" \
	--title "$TITLE"

echo "::endgroup::"

echo "::group::Uploading artifact to release"
gh release upload "$TAG" "$SLUG.zip"

echo "::endgroup::"
