#!/bin/bash

# If this is an NPM environment test we don't need a developer WordPress checkout

if [ "$WP_TRAVISCI" != "phpunit" ]; then
	exit 0;
fi

# This prepares a developer checkout of WordPress for running the test suite on Travis

mysql -u root -e "CREATE DATABASE wordpress_tests;"

CURRENT_DIR=$(pwd)

for WP_SLUG in 'master' 'latest' 'previous'; do
	echo "Preparing $WP_SLUG WordPress...";

	cd $CURRENT_DIR/..

	case $WP_SLUG in
	master)
		git clone --depth=1 --branch master git://develop.git.wordpress.org/ /tmp/wordpress-master
		;;
	latest)
		git clone --depth=1 --branch `php ./$PLUGIN_SLUG/tests/get-wp-version.php` git://develop.git.wordpress.org/ /tmp/wordpress-latest
		;;
	previous)
		git clone --depth=1 --branch `php ./$PLUGIN_SLUG/tests/get-wp-version.php --previous` git://develop.git.wordpress.org/ /tmp/wordpress-previous
		;;
	esac

	clone_exit_code=$?
	if [ $clone_exit_code -ne 0 ]; then
		echo "Failed to clone WordPress from develop.git.wordpress.org"
		exit 1
	fi

	cp -r $PLUGIN_SLUG "/tmp/wordpress-$WP_SLUG/src/wp-content/plugins/$PLUGIN_SLUG"
	cd /tmp/wordpress-$WP_SLUG

	cp wp-tests-config-sample.php wp-tests-config.php
	sed -i "s/youremptytestdbnamehere/wordpress_tests/" wp-tests-config.php
	sed -i "s/yourusernamehere/root/" wp-tests-config.php
	sed -i "s/yourpasswordhere//" wp-tests-config.php

	echo "Done!";
done

exit 0;
