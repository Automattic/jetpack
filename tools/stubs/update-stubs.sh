#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/../.. && pwd)
source "$BASE/tools/includes/check-osx-bash-version.sh"
source "$BASE/tools/includes/chalk-lite.sh"

TMPDIR="${TMPDIR:-/tmp}"
export WORK_DIR=$(mktemp -d "${TMPDIR%/}/update-stubs.XXXXXXXX")
trap 'rm -rf "$WORK_DIR"' EXIT

info 'Preparing stub-generator'
cd "$BASE/projects/packages/stub-generator/"
composer update

# Fetch the latest version of a plugin from WordPress.org
# and unpack it into "$WORK_DIR/$1"
#
# $1 - Plugin to fetch
# $WORK_DIR - Working directory.
function fetch_plugin {
	local slug=$1
	local url line

	local json=$(curl -L --fail --url "https://api.wordpress.org/plugins/info/1.0/$slug.json")
	if jq -e --arg slug "$slug" '.slug == $slug' <<<"$json" &>/dev/null; then
		url="$(jq -r '.download_link // ""' <<<"$json")"
		if [[ -z "$url" ]]; then
			error "Plugin $slug has no stable release."
			return 1
		else
			curl -L --fail --url "$url" --output "$WORK_DIR/$slug.zip" 2>&1
		fi
	elif jq -e '.error == "Plugin not found."' <<<"$json" &>/dev/null; then
		error "Plugin $slug is not published."
		return 1
	else
		error "Unexpected response from WordPress.org API for $slug"
		echo "$json"
		return 1
	fi

	echo "Unzipping..."
	local D=$PWD
	cd "$WORK_DIR"
	cols=$( tput cols )
	unzip "$slug.zip" | while read -r line; do
		printf '\r\e[0K%.*s' "$cols" "$line"
	done
	cd "$D"
	printf '\r\e[0KDone!\n'
}

# Fetch the latest release of a repo from GitHub
# and unpack it into "$WORK_DIR/$1"
#
# $1 - Repo to fetch
# $WORK_DIR - Working directory.
function fetch_repo {
	local repo=$1

	local json=$(curl -L --fail "https://api.github.com/repos/$repo/releases/latest")

	if ! jq -e '.tag_name // ""' <<<"$json" &>/dev/null; then
		error "Unexpected response from GitHub API for $repo"
		echo "$json"
		return 1
	fi

	local tag=$( jq -r '.tag_name // ""' <<<"$json" )
	mkdir -p "$WORK_DIR/$repo"
	git clone --branch "$tag" --depth 1 "https://github.com/$repo.git" "$WORK_DIR/$repo"
}

echo
info 'Downloading WooCommerce'
fetch_repo woocommerce/woocommerce

echo
info 'Extracting WooCommerce internal stubs'
"$BASE/projects/packages/stub-generator/bin/jetpack-stub-generator" --output "$BASE/.phan/stubs/woocommerce-internal-stubs.php" "$BASE/tools/stubs/woocommerce-internal-stub-defs.php"
