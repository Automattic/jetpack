#!/bin/bash

if php -r 'exit( version_compare( PHP_VERSION, "7.4.0", "<" ) ? 0 : 1 );'; then
	echo "PHP version is too old to run tests. 7.4 is required, but $(php -r 'echo PHP_VERSION;') is installed. Skipping.";
	exit 3
fi

# PHPCompatibility currently fails in 8.1.
if php -r 'exit( version_compare( PHP_VERSION, "8.0.9999999", ">" ) ? 0 : 1 );'; then
	echo "PHP version is too new to run tests (some upstream deps don't support it). 8.0 or earlier is required, but $(php -r 'echo PHP_VERSION;') is installed. Skipping.";
	exit 3
fi
