#!/bin/bash

if php -r 'exit( version_compare( PHP_VERSION, "7.2.0", "<" ) ? 0 : 1 );'; then
	echo "PHP version is too old to run tests. 7.2 is required, but $(php -r 'echo PHP_VERSION;') is installed. Skipping.";
	exit 3
fi

# TODO Fix the bug and remove this
if [[ "$WP_BRANCH" == 'trunk' ]]; then
    echo "Temporarily disabling tests against WP trunk until we get around to updating our codeception DB image."
    exit 3
fi
