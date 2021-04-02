#!/bin/bash

# Exit if any command fails.
set -e

function usage() {
	echo "usage: $0 command"
	echo "  start                        Setup the docker containers for E2E tests"
	echo "  reset                        Reset the containers state"
	echo "  tunnel on|off                Starts or stops a local tunnel"
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

tunnel() {
	if [ "${1}" == "on" ]; then
		echo "Opening tunnel"
		export NODE_ENV=test
		pm2 start "$(dirname "$0")/tunnel.js" --log ./output/logs/tunnel.log
	elif [ "${1}" == "off" ]; then
		echo "Closing tunnel"
		pm2 delete tunnel
	else
		usage
	fi
}

if [ "${1}" == "start" ]; then
	start_env
elif [ "${1}" == "reset" ]; then
	reset_env
elif [ "${1}" == "tunnel" ]; then
	tunnel "$2"
else
	usage
fi
