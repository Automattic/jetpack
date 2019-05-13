#!/usr/bin/env bash
if [[ ${RUN_E2E} == 1 ]]; then

	WP_SITE_URL="http://localhost:8080"
	WP_USERNAME="wordpress"
	WP_PASSWORD="wordpress"

	# Start xvfb to run the tests
	export WP_BASE_URL="$WP_SITE_URL"
	export WP_USERNAME
	export WP_PASSWORD
	export DISPLAY=:99.0
	sh -e /etc/init.d/xvfb start
	sleep 3

	# Run the tests
	npm run test-e2e
fi
