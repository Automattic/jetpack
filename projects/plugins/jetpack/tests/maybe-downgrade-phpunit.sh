#!/bin/bash

# Detect versions of WordPress that still require an ancient version of PHPUnit, and
# if necessary downgrade to a version that will work.
# @todo: Remove this once we drop support for WordPress 5.8. Also probably merge find-test-root.php back into bootstrap.php.
TEST_ROOT=$(php -r 'echo require "tests/php/find-test-root.php";')
if grep -q --fixed $'version_compare( $phpunit_version, \'8.0\', \'>=\' )' "$TEST_ROOT/includes/bootstrap.php" &&
	! phpunit --version | grep -q '^PHPUnit [567]\.'
then
	echo "The version of WordPress under test requires PHPUnit < 8.0, while the installed version is"
	phpunit --version

	TMP1="$(<composer.json)"
	TMP2="$(<composer.lock)"
	composer require --with-all-dependencies --ignore-platform-reqs phpunit/phpunit=^7.5
	echo "$TMP1" > composer.json
	echo "$TMP2" > composer.lock

	printf 'Now using '
	phpunit --version
else
	printf 'Using '
	phpunit --version
fi
