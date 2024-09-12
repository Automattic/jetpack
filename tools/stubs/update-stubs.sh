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
	if [[ -n "$TERM" && -t 1 ]]; then
		cols=$( tput cols )
		unzip "$slug.zip" | while read -r line; do
			printf '\r\e[0K%.*s' "$cols" "$line"
		done
	else
		unzip "$slug.zip"
	fi
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
info 'Downloading Akismet'
fetch_plugin akismet

echo
info 'Extracting Akismet stubs'
"$BASE/projects/packages/stub-generator/bin/jetpack-stub-generator" --output "$BASE/.phan/stubs/akismet-stubs.php" "$BASE/tools/stubs/akismet-stub-defs.php"

# Apparently there are two different AMP plugins we have to deal with.
echo
info 'Downloading AMP plugin'
fetch_plugin amp

echo
info 'Downloading AMP for WP plugin'
fetch_plugin accelerated-mobile-pages

echo
info 'Extracting AMP stubs'
"$BASE/projects/packages/stub-generator/bin/jetpack-stub-generator" --output "$BASE/.phan/stubs/amp-stubs.php" "$BASE/tools/stubs/amp-stub-defs.php"

echo
info 'Downloading WordPress.com Editing Toolkit'
fetch_plugin full-site-editing

echo
info 'Extracting WordPress.com Editing Toolkit stubs'
"$BASE/projects/packages/stub-generator/bin/jetpack-stub-generator" --output "$BASE/.phan/stubs/full-site-editing-stubs.php" "$BASE/tools/stubs/full-site-editing-stub-defs.php"

echo
info 'Downloading WooPayments'
fetch_plugin woocommerce-payments

echo
info 'Extracting WooPayments stubs'
"$BASE/projects/packages/stub-generator/bin/jetpack-stub-generator" --output "$BASE/.phan/stubs/woocommerce-payments-stubs.php" "$BASE/tools/stubs/woocommerce-payments-stub-defs.php"

echo
info 'Downloading WooCommerce'
fetch_repo woocommerce/woocommerce

echo
info 'Extracting WooCommerce internal stubs'
"$BASE/projects/packages/stub-generator/bin/jetpack-stub-generator" --output "$BASE/.phan/stubs/woocommerce-internal-stubs.php" "$BASE/tools/stubs/woocommerce-internal-stub-defs.php"

echo
info 'Downloading PHPUnit'
mkdir -p "$WORK_DIR/phpunit"
jq '{ "require-dev": { "yoast/phpunit-polyfills": .["require-dev"]["yoast/phpunit-polyfills"] } }' "$BASE/tools/cli/skeletons/common/composer.json" > "$WORK_DIR/phpunit/composer.json"
composer --working-dir="$WORK_DIR/phpunit" update

echo
info 'Extracting PHPUnit stubs'
"$BASE/projects/packages/stub-generator/bin/jetpack-stub-generator" --output "$BASE/.phan/stubs/phpunit-stubs.php" "$BASE/tools/stubs/phpunit-stub-defs.php"
php "$BASE/tools/stubs/munge-phpunit-stubs.php" "$BASE/.phan/stubs/phpunit-stubs.php"
for f in "$WORK_DIR"/phpunit/vendor/{phpunit,sebastian}/*; do
	echo "${f#$WORK_DIR/phpunit/}"
done > "$BASE/.phan/stubs/phpunit-dirs.txt"
