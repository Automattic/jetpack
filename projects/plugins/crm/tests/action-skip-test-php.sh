#!/usr/bin/env bash

# Skip tests on PHP 8.5+ due to dependency constraints (dompdf v2)
if php -r 'exit(PHP_VERSION_ID >= 80500 ? 0 : 1);'; then
	echo "Skipping tests on PHP 8.5+ (current: $(php -r 'echo PHP_VERSION;'))"
	exit 3
fi

# Uncomment the below snippet to disable tests on WP trunk
# if [[ "$WP_BRANCH" == 'trunk' ]]; then
# 	echo "Codeception tests against WP trunk are temporarily disabled."
# 	exit 3
# fi
