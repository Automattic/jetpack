#!/bin/bash

set -eo pipefail

BETAJSON="$(curl -L --fail --url "https://betadownload.jetpack.me/plugins.json")"
jq -e '.' <<<"$BETAJSON" &>/dev/null

mkdir work
mkdir zips

if [[ "$PLUGIN_SLUG" == wpcomsh ]]; then
	echo "Skipping $PLUGIN_SLUG, doesn't work on self-hosted sites."
	exit 0
fi

echo "::group::Creating $PLUGIN_SLUG-dev.zip"
mv "build/$PLUGIN_MIRROR" "work/$PLUGIN_SLUG"
touch "work/$PLUGIN_SLUG/ci-flag.txt"
(cd work && zip -r "../zips/${PLUGIN_SLUG}-dev.zip" "$PLUGIN_SLUG")
rm -rf "work/$PLUGIN_SLUG"
echo "::endgroup::"

echo "::group::Fetching $PLUGIN_SLUG-trunk.zip..."
BETASLUG="$(jq -r '.extra["beta-plugin-slug"] // .extra["wp-plugin-slug"] // ""' "commit/$PLUGIN_SRC/composer.json")"
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
				mv "work/$BETASLUG-dev" "work/$PLUGIN_SLUG"
				(cd work && zip -qr "../zips/${PLUGIN_SLUG}-trunk.zip" "$PLUGIN_SLUG")
				rm -rf "work/$PLUGIN_SLUG" "work/tmp.zip"
			fi
		else
			echo "::error::Unexpected response from betadownload.jetpack.me for $PLUGIN_SLUG"
			echo "$JSON"
			echo "❌ Unexpected response from betadownload.jetpack.me for $PLUGIN_SLUG" >> "$GITHUB_STEP_SUMMARY"
			exit 1
		fi
	fi
fi
echo "::endgroup::"

echo "::group::Fetching $PLUGIN_SLUG-stable.zip..."
JSON="$(curl "https://api.wordpress.org/plugins/info/1.0/$PLUGIN_SLUG.json")"
if jq -e --arg slug "$PLUGIN_SLUG" '.slug == $slug' <<<"$JSON" &>/dev/null; then
	URL="$(jq -r '.download_link // ""' <<<"$JSON")"
	if [[ -z "$URL" ]]; then
		echo "Plugin has no stable release."
	else
		curl -L --fail --url "$URL" --output "zips/$PLUGIN_SLUG-stable.zip" 2>&1
	fi
elif jq -e '.error == "Plugin not found."' <<<"$JSON" &>/dev/null; then
	echo "Plugin is not published."
else
	echo "::error::Unexpected response from WordPress.org API for $PLUGIN_SLUG"
	echo "$JSON"
	echo "❌ Unexpected response from WordPress.org API for $PLUGIN_SLUG" >> "$GITHUB_STEP_SUMMARY"
	exit 1
fi
echo "::endgroup::"
