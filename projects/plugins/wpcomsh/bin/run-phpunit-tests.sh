#!/usr/bin/env bash
set -euo pipefail

function ensure_composer() {
	mkdir -p "$HOME/.composer"

	if [ -f "$HOME/composer" ]; then
		echo "OK: $HOME/composer"
	else
		if wget -O "/tmp/composer-setup.php" https://getcomposer.org/installer; then
			chmod a+x "/tmp/composer-setup.php"
		else
			echo "Failed to download composer"
			exit 1
		fi

		php /tmp/composer-setup.php --install-dir="$HOME" --filename=composer

		echo "Composer set up successfully"
	fi
}

function setup_tests() {
	cd "$HOME/htdocs/wp-content/mu-plugins/wpcomsh"
	VER=$( jq -r '.["require-dev"]["yoast/phpunit-polyfills"]' composer.json )
	"$HOME/composer" global require "yoast/phpunit-polyfills=$VER" --dev -W

	bin/install-wp-tests.sh "$DB_NAME" "$DB_USER" "$DB_PASSWORD" "$DB_HOST" latest true

	echo "WordPress tests set up successfully"
}

function run_tests() {
	cd "$HOME/htdocs/wp-content/mu-plugins/wpcomsh"

	# Caching causes issues, so move it.
	[[ -f "$WP_CONTENT_DIR/object-cache.php" ]] && mv -v "$WP_CONTENT_DIR"/object-cache{,_disabled}.php

	"$HOME/.composer/vendor/bin/phpunit" --testsuite wpcloud

	# Move it back into place
	[[ -f "$WP_CONTENT_DIR/object-cache_disabled.php" ]] && mv -v "$WP_CONTENT_DIR"/object-cache{_disabled,}.php
}

export WP_TESTS_PHPUNIT_POLYFILLS_PATH="$HOME/.composer/vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php"
export COMPOSER_HOME="$HOME/.composer"
export WP_CORE_DIR="$HOME/htdocs/__wp__"
export WP_CONTENT_DIR="$HOME/htdocs/wp-content"

ensure_composer
setup_tests
run_tests

