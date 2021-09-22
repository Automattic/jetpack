#!/bin/bash

# Detect versions of WordPress that still require an ancient version of PHPUnit, and find a version
# of PHPUnit that'll work.
# @todo: Remove this once we drop support for WordPress 5.8. Also probably merge find-test-root.php back into bootstrap.php.
phpunit=phpunit
TEST_ROOT=$(php -r 'echo require "tests/php/find-test-root.php";')
if grep -q --fixed $'version_compare( $phpunit_version, \'8.0\', \'>=\' )' "$TEST_ROOT/includes/bootstrap.php" &&
	! phpunit --version | grep -q '^PHPUnit [567]\.'
then
	echo "The version of WordPress under test requires PHPUnit < 8.0, while the installed version is"
	phpunit --version
	if [[ -e tests/php/phpunit-7.phar ]]; then
		echo "Using previously downloaded PHPUnit 7 phar."
	else
		echo "Downloading PHPUnit 7..."
		curl -fSL https://phar.phpunit.de/phpunit-7.phar --output tests/php/phpunit-7.phar
		chmod +x tests/php/phpunit-7.phar
	fi
	phpunit="$PWD/tests/php/phpunit-7.phar"
	$phpunit --version
fi
