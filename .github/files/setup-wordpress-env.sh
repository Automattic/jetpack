#!/bin/bash

## Environment used by this script:
#
# mysql must be listening on 127.0.0.1:3306
# `composer global` will be run!
# ~/.my.cnf will be written!
#
# Required:
# - WP_BRANCH: Version of WordPress to check out.
# - TEST_SCRIPT: Which test script will be run.
#
# Other:
# - GITHUB_ENV: File written to to set environment variables for later steps.

set -eo pipefail

echo "::group::Setting up MySQL"
cat <<EOF > ~/.my.cnf
[client]
host=127.0.0.1
port=3306
user=root
password=root
EOF
chmod 0600 ~/.my.cnf
mysql -e "set global wait_timeout = 3600;"
mysql -e "DROP DATABASE IF EXISTS wordpress_tests;"
mysql -e "CREATE DATABASE wordpress_tests;"
echo "::endgroup::"

echo "::group::Preparing WordPress from \"$WP_BRANCH\" branch";
case "$WP_BRANCH" in
	trunk)
		TAG=trunk
		;;
	latest)
		TAG=$(php ./tools/get-wp-version.php)
		;;
	previous)
		# We hard-code the version here because there's a time near WP releases where
		# we've dropped the old 'previous' but WP hasn't actually released the new 'latest'
		TAG=6.4
		;;
	*)
		echo "Unrecognized value for WP_BRANCH: $WP_BRANCH" >&2
		exit 1
		;;
esac
git clone --depth=1 --branch "$TAG" git://develop.git.wordpress.org/ "/tmp/wordpress-$WP_BRANCH"
# We need a built version of WordPress to test against, so download that into the src directory instead of what's in wordpress-develop.
rm -rf "/tmp/wordpress-$WP_BRANCH/src"
git clone --depth=1 --branch "$TAG" git://core.git.wordpress.org/ "/tmp/wordpress-$WP_BRANCH/src"
echo "::endgroup::"

if [[ -n "$GITHUB_ENV" ]]; then
	echo "WORDPRESS_DEVELOP_DIR=/tmp/wordpress-$WP_BRANCH" >> "$GITHUB_ENV"
	echo "WORDPRESS_DIR=/tmp/wordpress-$WP_BRANCH/src" >> "$GITHUB_ENV"
fi

# Don't symlink, it breaks when copied later.
export COMPOSER_MIRROR_PATH_REPOS=true

BASE="$(pwd)"
PKGVERSIONS="$(jq -nc 'reduce inputs as $in ({}; .[$in.name] |= ( $in.extra["branch-alias"]["dev-trunk"] // "dev-trunk" ) )' projects/packages/*/composer.json)"
EXIT=0
for PLUGIN in projects/plugins/*/composer.json; do
	DIR="${PLUGIN%/composer.json}"
	NAME="$(basename "$DIR")"

	echo "::group::Installing plugin $NAME into WordPress"

	if php -r 'exit( preg_match( "/^>=\\s*(\\d+\\.\\d+)$/", $argv[1], $m ) && version_compare( PHP_VERSION, $m[1], "<" ) ? 0 : 1 );' "$( jq -r '.require.php // ""' "$DIR/composer.json" )"; then
		echo "::endgroup::"
		echo "Skipping install of plugin $NAME, requires PHP $( jq -r '.require.php // ""' "$DIR/composer.json" )"
		continue
	fi

	if jq --arg script "skip-$TEST_SCRIPT" -e '.scripts[$script] // false' "$DIR/composer.json" > /dev/null; then
		{ composer --working-dir="$DIR" run "skip-$TEST_SCRIPT"; CODE=$?; } || true
		if [[ $CODE -eq 3 ]]; then
			echo "::endgroup::"
			echo "Skipping install of plugin $NAME due to skip-$TEST_SCRIPT script"
			continue
		elif [[ $CODE -ne 0 ]]; then
			echo "::endgroup::"
			echo "::error::Script skip-$TEST_SCRIPT for plugin $NAME failed to run! ($CODE)"
			EXIT=1
			continue
		fi
	fi

	cd "$DIR"
	if [[ ! -f "composer.lock" ]]; then
		echo 'No composer.lock, running `composer update`'
		composer update
	elif composer check-platform-reqs --lock; then
		echo 'Platform reqs pass, running `composer install`'
		composer install
	else
		# Composer can't directly tell us which packages are dev deps, but we can get lists of all deps and just the non-dev deps.
		# So we use `diff` to find which aren't in the non-dev list, and `sed` to extract just the `> ` lines with the actual package names (and remove the `> ` too).
		# Adding `|| true` makes sure the exit code stays 0 so `-eo pipefail` doesn't trigger.
		TMP=$(diff <(composer info --locked --no-dev --format=json | jq -r '.locked[].name' | sort) <(composer info --locked --format=json | jq -r '.locked[].name' | sort) | sed -n 's/^> //p' || true)
		if [[ -n "$TMP" ]]; then
			echo 'Platform reqs failed, running `composer update` for dev dependencies'
			DEPS=()
			mapfile -t DEPS <<<"$TMP"
			if ! composer update "${DEPS[@]}"; then
				echo "::endgroup::"
				echo "::error::plugins/$NAME: Platform reqs failed for PHP $(php -r 'echo PHP_VERSION;') and updating dev deps didn't help. The plugin is likely broken for that PHP version."
				EXIT=1
				cd "$BASE"
				continue
			fi
		else
			echo "::endgroup::"
			echo "::error::plugins/$NAME: Platform reqs failed for PHP $(php -r 'echo PHP_VERSION;'). The plugin is likely broken for that PHP version."
			EXIT=1
			cd "$BASE"
			continue
		fi
	fi
	cd "$BASE"

	cp -r "$DIR" "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$NAME"
	# Plugin dir for tests in WP >= 5.6-beta1
	ln -s "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$NAME" "/tmp/wordpress-$WP_BRANCH/tests/phpunit/data/plugins/$NAME"

	# Update monorepo repo entry in composer.json to point back here, and to mirror per COMPOSER_MIRROR_PATH_REPOS.
	JSON="$(jq --tab --arg dir "$BASE/$DIR" --argjson pkgversions "$PKGVERSIONS" '( .repositories // empty | .[] | select( .options.monorepo ) ) |= ( .url |= "\($dir)/\(.)" | .options.symlink |= false | .options.versions |= $pkgversions )' "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$NAME/composer.json")"
	echo "$JSON" > "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$NAME/composer.json"

	echo "::endgroup::"
done

# Install WooCommerce plugin used for some Jetpack integration tests.
if [[ "$WITH_WOOCOMMERCE" == true ]]; then
	echo "::group::Installing plugin WooCommerce into WordPress"

	WOO_REPO_URL="https://github.com/woocommerce/woocommerce"
	WOO_GH_API_URL="https://api.github.com/repos/woocommerce/woocommerce/releases/latest"

	RESPONSE=$(curl -sSL --fail --header "Authorization: Bearer $API_TOKEN_GITHUB" "$WOO_GH_API_URL")
	WOO_LATEST_TAG=$(jq -r '.tag_name' <<< "$RESPONSE")
	WOO_DL_URL=$(jq -r '.assets[0].browser_download_url' <<< "$RESPONSE")

	if [[ -n "$WOO_LATEST_TAG" && -n "$WOO_DL_URL" ]]; then
		cd "/tmp"
		echo "Fetching latest WooCommerce tag: $WOO_LATEST_TAG"

		# Download the built Woo plugin.
		curl -sS -L --fail "$WOO_DL_URL" -o "woocommerce.zip"
		unzip -q "woocommerce.zip"
		mv woocommerce "wordpress-$WP_BRANCH/src/wp-content/plugins"

		# Add the '/tests' directory not present in the built Woo download.
		git clone --depth 1 --branch "$WOO_LATEST_TAG" "$WOO_REPO_URL" &> /dev/null
		cp -r "woocommerce/plugins/woocommerce/tests" "wordpress-$WP_BRANCH/src/wp-content/plugins/woocommerce"
	else
		echo "::error::Error fetching latest WooCommerce plugin for Jetpack integration tests."
		EXIT=1
	fi

	cd "$BASE"
	echo "::endgroup::"
fi

# Install the wpcomsh plugin used for some Jetpack integration tests.
if [[ "$WITH_WPCOMSH" == true ]]; then
	echo "::group::Installing wpcomsh into WordPress"

	mkdir "/tmp/wordpress-$WP_BRANCH/src/wp-content/mu-plugins"
	cp -r "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/wpcomsh" "/tmp/wordpress-$WP_BRANCH/src/wp-content/mu-plugins/wpcomsh"

	echo "::endgroup::"
fi

cd "/tmp/wordpress-$WP_BRANCH"

cp wp-tests-config-sample.php wp-tests-config.php
sed -i "s/youremptytestdbnamehere/wordpress_tests/" wp-tests-config.php
sed -i "s/yourusernamehere/root/" wp-tests-config.php
sed -i "s/yourpasswordhere/root/" wp-tests-config.php
sed -i "s/localhost/127.0.0.1/" wp-tests-config.php

# If WooCommerce is installed, be sure we get the monorepo versions rather than the versions distributed with that.
echo "define( 'JETPACK_AUTOLOAD_DEV', true );" >> wp-tests-config.php

exit $EXIT
