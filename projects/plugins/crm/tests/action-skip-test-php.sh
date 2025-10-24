#!/usr/bin/env bash

# Skip tests on PHP > 8.4 due to dependency constraints
if php -r 'exit(PHP_VERSION_ID > 80499 ? 0 : 1);'; then
	echo "Skipping tests on PHP > 8.4 (current: $(php -r 'echo PHP_VERSION;'))"
	exit 3
fi

# Uncomment the below snippet to disable tests on WP trunk
# if [[ "$WP_BRANCH" == 'trunk' ]]; then
# 	echo "Codeception tests against WP trunk are temporarily disabled."
# 	exit 3
# fi
