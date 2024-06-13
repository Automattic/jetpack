#!/bin/bash

set -eo pipefail

BETAJSON="$(curl -L --fail --url "https://betadownload.jetpack.me/plugins.json")"
jq -e '.' <<<"$BETAJSON" &>/dev/null

mkdir work
mkdir zips
while IFS=$'\t' read -r SRC MIRROR SLUG; do
	if [[ "$SLUG" == wpcomsh ]]; then
		echo "Skipping $SLUG, doesn't work on self-hosted sites."
		continue
	fi

	echo "::group::Creating $SLUG-dev.zip"
	mv "build/$MIRROR" "work/$SLUG"
	touch "work/$SLUG/ci-flag.txt"
	(cd work && zip -r "../zips/${SLUG}-dev.zip" "$SLUG")
	rm -rf "work/$SLUG"
	echo "::endgroup::"

	echo "::group::Fetching $SLUG-trunk.zip..."
	BETASLUG="$(jq -r '.extra["beta-plugin-slug"] // .extra["wp-plugin-slug"] // ""' "commit/$SRC/composer.json")"
	if [[ -z "$BETASLUG" ]]; then
		echo "No beta-plugin-slug or wp-plugin-slug in composer.json, skipping"
	else
		URL="$(jq -r --arg slug "$BETASLUG" '.[$slug].manifest_url // ""' <<<"$BETAJSON")"
		if [[ -z "$URL" ]]; then
			echo "Beta slug $BETASLUG is not in plugins.json, skipping"
		else
			JSON="$(curl -L --fail --url "$URL")"
			if jq -e '.' <<<"$JSON" &>/dev/null; then
				URL="$(jq -r '.trunk.download_url // .master.download_url // ""' <<<"$JSON")"
				if [[ -z "$URL" ]]; then
					echo "Plugin has no trunk build."
				else
					curl -L --fail --url "$URL" --output "work/tmp.zip" 2>&1
					(cd work && unzip -q tmp.zip)
					mv "work/$BETASLUG-dev" "work/$SLUG"
					(cd work && zip -qr "../zips/${SLUG}-trunk.zip" "$SLUG")
					rm -rf "work/$SLUG" "work/tmp.zip"
				fi
			else
				echo "::error::Unexpected response from betadownload.jetpack.me for $SLUG"
				echo "$JSON"
				echo "info=❌ Unexpected response from betadownload.jetpack.me for $SLUG" >> "$GITHUB_OUTPUT"
				exit 1
			fi
		fi
	fi
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
		echo "info=❌ Unexpected response from WordPress.org API for $SLUG" >> "$GITHUB_OUTPUT"
		exit 1
	fi
	echo "::endgroup::"
done < build/plugins.tsv

echo 'info=' >> "$GITHUB_OUTPUT"
