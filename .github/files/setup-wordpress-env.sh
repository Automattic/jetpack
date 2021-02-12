#!/bin/bash

## Environment used by this script:
#
# mysql must be listening on 127.0.0.1:3306
# `composer global` will be run!
# ~/.my.cnf will be written!
#
# Required:
# - PHP_VERSION: Version of PHP in use.
# - WP_BRANCH: Version of WordPress to check out.
#
# Other:
# - GITHUB_PATH: File written to if set to propagate composer path.

set -eo pipefail

# Add global composer bin dir into PATH
COMPOSER_BIN_DIR=$(composer global config --absolute --quiet bin-dir)
export PATH="$COMPOSER_BIN_DIR:$PATH"

# Update path for subsequent Github Action steps
if [[ -n "$GITHUB_PATH" ]]; then
	echo "$COMPOSER_BIN_DIR" >> "$GITHUB_PATH"
fi

echo "::group::Installing PHPUnit"
if [[ "${PHP_VERSION:0:2}" == "8." ]]; then
	composer global require "phpunit/phpunit=7.5.*" --ignore-platform-reqs
else
	composer global require "phpunit/phpunit=5.7.* || 6.5.* || 7.5.*"
fi
echo "::endgroup::"

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
mysql -e "CREATE DATABASE wordpress_tests;"
echo "::endgroup::"

echo "::group::Preparing WordPress from \"$WP_BRANCH\" branch";
case "$WP_BRANCH" in
	master)
		git clone --depth=1 --branch master git://develop.git.wordpress.org/ /tmp/wordpress-master
		;;
	latest)
		git clone --depth=1 --branch "$(php ./tools/get-wp-version.php)" git://develop.git.wordpress.org/ /tmp/wordpress-latest
		;;
	previous)
		# We hard-code the version here because there's a time near WP releases where
		# we've dropped the old 'previous' but WP hasn't actually released the new 'latest'
		git clone --depth=1 --branch 5.5 git://develop.git.wordpress.org/ /tmp/wordpress-previous
		;;
esac
echo "::endgroup::"

# Don't symlink, it breaks when copied later.
export COMPOSER_MIRROR_PATH_REPOS=true

BASE="$(pwd)"
for PLUGIN in projects/plugins/*/composer.json; do
	DIR="${PLUGIN%/composer.json}"
	NAME="$(basename "$DIR")"
	echo "::group::Installing plugin $NAME into WordPress"
	cd "$DIR"
	composer install
	cd "$BASE"

	cp -r "$DIR" "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$NAME"
	# Plugin dir for tests in WP >= 5.6-beta1
	ln -s "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$NAME" "/tmp/wordpress-$WP_BRANCH/tests/phpunit/data/plugins/$NAME"
	echo "::endgroup::"
done

cd "/tmp/wordpress-$WP_BRANCH"

cp wp-tests-config-sample.php wp-tests-config.php
sed -i "s/youremptytestdbnamehere/wordpress_tests/" wp-tests-config.php
sed -i "s/yourusernamehere/root/" wp-tests-config.php
sed -i "s/yourpasswordhere/root/" wp-tests-config.php
sed -i "s/localhost/127.0.0.1/" wp-tests-config.php

exit 0;
