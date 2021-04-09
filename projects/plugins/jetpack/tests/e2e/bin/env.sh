#!/bin/bash

# Exit if any command fails.
set -e

function usage {
	echo "usage: $0 command"
	echo "  start                        Setup the docker containers for E2E tests"
	echo "  reset                        Reset the containers state"
	echo "  -h | usage                   Output this message"
	exit 1
}

start_env() {
	yarn wp-env start
	configure_wp_env
}

reset_env() {
	yarn wp-env clean
	configure_wp_env
}

configure_wp_env() {
	yarn wp-env run tests-wordpress sh wp-content/plugins/jetpack-dev/tests/e2e/bin/wp-setup.sh

	if [ "$GUTENBERG" == "latest" ]; then
		yarn wp-env run tests-cli wp plugin install gutenberg --activate
	fi

	yarn wp-env run tests-cli wp plugin activate jetpack-dev

	echo
	echo "WordPress is ready!"
	echo
}

if [ "${1}" == "start" ]; then
	start_env
elif [ "${1}" == "reset" ]; then
	reset_env
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
