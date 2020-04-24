#!/bin/bash

# If this is an NPM environment test, we don't need a developer WordPress checkout
if [ "$WP_TRAVISCI" != "phpunit" ]; then
	exit 0;
fi

phpenv config-rm xdebug.ini

# Configure PHP and PHPUnit environment
if [[ ${TRAVIS_PHP_VERSION} == "nightly" ]]; then
	composer install --ignore-platform-reqs
	composer global require "phpunit/phpunit=7.5.*" --ignore-platform-reqs
elif [[ ${TRAVIS_PHP_VERSION:0:3} == "7.0" ]]; then
  composer remove sirbrillig/phpcs-changed --dev
  composer install
	composer global require "phpunit/phpunit=6.5.*" --no-suggest
elif [[ ${TRAVIS_PHP_VERSION:0:2} == "7." ]]; then
  composer install
  composer global require "phpunit/phpunit=7.5.*" --no-suggest
elif [[ ${TRAVIS_PHP_VERSION:0:2} == "5." ]]; then
  composer remove sirbrillig/phpcs-changed --dev
  composer install
	composer global require "phpunit/phpunit=5.7.*" --no-suggest
fi

mysql -e "set global wait_timeout = 3600;"

# Prepare a developer checkout of WordPress
mysql -u root -e "CREATE DATABASE wordpress_tests;"

echo "Preparing WordPress from \"$WP_BRANCH\" branch...";
case $WP_BRANCH in
master)
	git clone --depth=1 --branch master git://develop.git.wordpress.org/ /tmp/wordpress-master
	;;
latest)
	git clone --depth=1 --branch $(php ./tests/get-wp-version.php) git://develop.git.wordpress.org/ /tmp/wordpress-latest
	;;
previous)
	git clone --depth=1 --branch 5.3 git://develop.git.wordpress.org/ /tmp/wordpress-previous
	;;
esac

clone_exit_code=$?
if [ $clone_exit_code -ne 0 ]; then
	echo "Failed to clone WordPress from develop.git.wordpress.org"
	exit 1
fi

cd ..
cp -r $PLUGIN_SLUG "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$PLUGIN_SLUG"
cd /tmp/wordpress-$WP_BRANCH

cp wp-tests-config-sample.php wp-tests-config.php
sed -i "s/youremptytestdbnamehere/wordpress_tests/" wp-tests-config.php
sed -i "s/yourusernamehere/root/" wp-tests-config.php
sed -i "s/yourpasswordhere//" wp-tests-config.php

exit 0;
