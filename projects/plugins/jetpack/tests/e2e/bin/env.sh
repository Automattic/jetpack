#!/bin/bash

# Exit if any command fails.
set -e

function usage {
	echo "usage: $0 command"
	echo "  start                        Setup the docker containers for E2E tests"
	echo "  reset                        Reset the containers state"
	echo "  gb-setup                     Setup Gutenberg plugin"
	echo "  -h | usage                   Output this message"
	exit 1
}

start_env() {
	pnpx wp-env start
	configure_wp_env
}

reset_env() {
	pnpx wp-env clean
	configure_wp_env
}

gb_setup() {
	GB_ZIP="wp-content/gutenberg.zip"
	pnpx wp-env run tests-wordpress "./wp-content/plugins/jetpack-dev/tests/e2e/bin/container-setup.sh gb-setup $GB_ZIP"
	pnpx wp-env run tests-cli "wp plugin install $GB_ZIP"
	pnpx wp-env run tests-cli "wp plugin activate gutenberg"
}

configure_wp_env() {
	pnpx wp-env run tests-wordpress ./wp-content/plugins/jetpack-dev/tests/e2e/bin/container-setup.sh wp-config
	pnpx wp-env run tests-cli wp plugin activate jetpack-dev

	echo
	echo "WordPress is ready!"
	echo
}

if [ "${1}" == "start" ]; then
	start_env
elif [ "${1}" == "reset" ]; then
	reset_env
elif [ "${1}" == "gb-setup" ]; then
	gb_setup
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
