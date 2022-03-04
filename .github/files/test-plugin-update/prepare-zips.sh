#!/bin/bash

set -eo pipefail

mkdir work
mkdir zips
while IFS=$'\t' read -r SRC MIRROR SLUG; do
	echo "::group::Creating $SLUG-dev.zip"
	mv "build/$MIRROR" "work/$SLUG"
	touch "work/$SLUG/ci-flag.txt"
	(cd work && zip -r "../zips/${SLUG}-dev.zip" "$SLUG")
	rm -rf "work/$SLUG"
	echo "::endgroup::"

	echo "::group::Fetching $SLUG-stable.zip..."
	JSON="$(curl "https://api.wordpress.org/plugins/info/1.0/$SLUG.json")"
	if jq -e --arg slug "$SLUG" '.slug == $slug' <<<"$JSON" &>/dev/null; then
		URL="$(jq -r '.download_link // ""' <<<"$JSON")"
		if [[ -z "$URL" ]]; then
			echo "Plugin has no stable release."
		else
			curl -L --fail --url "$URL" --output "zips/$SLUG-stable.zip" 2>&1
		fi
	elif jq -e '.error == "Plugin not found."' <<<"$JSON" &>/dev/null; then
		echo "Plugin is not published."
	else
		echo "::error::Unexpected response from WordPress.org API for $SLUG"
		echo "$JSON"
		exit 1
	fi
	echo "::endgroup::"
done < build/plugins.tsv
