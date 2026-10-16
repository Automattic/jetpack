#!/usr/bin/env bash

set -eo pipefail

function fetchurl {
	local code=0
	local delay=$(( 30 + RANDOM % 8 ))
	local ct=0

	while true; do
		curl -L --fail --retry 2 --retry-delay $delay --url "$1" --output "$2" 2>&1 || code=$?
		case $code in
			0)
				return 0
				;;
			35)
				ct=$(( ct + 1 ))
				if [[ $ct -ge 3 ]]; then
					echo "::error::Multiple network errors trying to download $1."
					echo "❌ Multiple network errors trying to download $1" >> "$GITHUB_STEP_SUMMARY"
					exit $code
				fi
				echo "Network error. Will retry."
				sleep $delay
				continue
				;;
			*)
				echo "::error::Failed to download $1."
				echo "❌ Failed to download $1" >> "$GITHUB_STEP_SUMMARY"
				exit $code
				;;
		esac
	done
}

function fetchjson {
	local code=0

	fetchurl "$1" "$2" || return $?
	if ! jq -e '.' "$2" &>/dev/null; then
		echo "::error::Unexpected response from $1"
		cat "$2"
		echo "❌ Unexpected response from $1" >> "$GITHUB_STEP_SUMMARY"
		exit 1
	fi
	return 0
}


mkdir work
mkdir zips

fetchjson "https://betadownload.jetpack.me/plugins.json" work/plugins.json

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
	URL="$(jq -r --arg slug "$BETASLUG" '.[$slug].manifest_url // ""' work/plugins.json)"
	if [[ -z "$URL" ]]; then
		echo "Beta slug $BETASLUG is not in plugins.json, skipping"
	else
		fetchjson "$URL" "work/manifest.json"
		URL="$(jq -r '.trunk.download_url // .master.download_url // ""' work/manifest.json)"
		if [[ -z "$URL" ]]; then
			echo "Plugin has no trunk build."
		else
			fetchurl "$URL" "work/tmp.zip"
			(cd work && unzip -q tmp.zip)
			mv "work/$BETASLUG-dev" "work/$PLUGIN_SLUG"
			(cd work && zip -qr "../zips/${PLUGIN_SLUG}-trunk.zip" "$PLUGIN_SLUG")
			rm -rf "work/$PLUGIN_SLUG" "work/tmp.zip"
		fi
	fi
fi
echo "::endgroup::"

echo "::group::Fetching $PLUGIN_SLUG-stable.zip..."
# Note: Don't use --fail here, the API returns a 404 with a valid resonse if the plugin doesn't exist. Sigh.
JSON="$(curl -L --retry 2 --retry-delay $(( 30 + RANDOM % 8 )) "https://api.wordpress.org/plugins/info/1.0/$PLUGIN_SLUG.json")"
if jq -e --arg slug "$PLUGIN_SLUG" '.slug == $slug' <<<"$JSON" &>/dev/null; then
	URL="$(jq -r '.download_link // ""' <<<"$JSON")"
	if [[ -z "$URL" ]]; then
		echo "Plugin has no stable release."
	else
		fetchurl "$URL" "zips/$PLUGIN_SLUG-stable.zip"
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
