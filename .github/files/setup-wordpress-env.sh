#!/bin/bash

## Environment used by this script:
#
# mysql must be listening on 127.0.0.1:3306
# `composer global` will be run!
# ~/.my.cnf will be written!
#
# Required:
# - WP_BRANCH: Version of WordPress to check out.
#
# Other:
# - GITHUB_PATH: File written to if set to propagate composer path.

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
		TAG=5.9
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

# Don't symlink, it breaks when copied later.
export COMPOSER_MIRROR_PATH_REPOS=true

BASE="$(pwd)"
PKGVERSIONS="$(jq -nc 'reduce inputs as $in ({}; .[$in.name] |= ( $in.extra["branch-alias"]["dev-trunk"] // "dev-trunk" ) )' projects/packages/*/composer.json)"
for PLUGIN in projects/plugins/*/composer.json; do
	DIR="${PLUGIN%/composer.json}"
	NAME="$(basename "$DIR")"
	echo "::group::Installing plugin $NAME into WordPress"
	cd "$DIR"
	if [[ ! -f "composer.lock" ]]; then
		echo 'No composer.lock, running `composer update`'
		composer update
	elif composer check-platform-reqs --lock; then
		echo 'Platform reqs pass, running `composer install`'
		composer install
	else
		echo 'Platform reqs failed, running `composer update`'
		composer update
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

cd "/tmp/wordpress-$WP_BRANCH"

cp wp-tests-config-sample.php wp-tests-config.php
sed -i "s/youremptytestdbnamehere/wordpress_tests/" wp-tests-config.php
sed -i "s/yourusernamehere/root/" wp-tests-config.php
sed -i "s/yourpasswordhere/root/" wp-tests-config.php
sed -i "s/localhost/127.0.0.1/" wp-tests-config.php

exit 0;
