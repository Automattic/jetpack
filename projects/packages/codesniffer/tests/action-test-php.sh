#!/bin/bash

if php -r 'exit( version_compare( PHP_VERSION, "7.2.0", "<" ) ? 0 : 1 );'; then
	echo "PHP version is too old to run tests. 7.2 is required, but $(php -r 'echo PHP_VERSION;') is installed. Skipping.";
	exit 0
fi

composer update
composer phpunit
