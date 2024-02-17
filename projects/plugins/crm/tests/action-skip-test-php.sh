#!/bin/bash

if php -r 'exit( version_compare( PHP_VERSION, "7.4.0", "<" ) ? 0 : 1 );'; then
	echo "PHP version is too old to run tests. 7.4 is required, but $(php -r 'echo PHP_VERSION;') is installed. Skipping.";
	exit 3
fi

# Uncomment the below snippet to disable tests on WP trunk
# if [[ "$WP_BRANCH" == 'trunk' ]]; then
# 	echo "Codeception tests against WP trunk are temporarily disabled."
# 	exit 3
# fi
