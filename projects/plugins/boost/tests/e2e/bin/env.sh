#!/bin/bash

# Exit if any command fails.
set -e

function usage {
	echo "usage: $0 command"
	echo "  start                        Setup the docker containers for E2E tests"
	echo "  stop                         Stop the docker containers"
	echo "  reset                        Reset the containers state"
	echo "  destroy                      Remove the docker containers and related resources"
	echo "  -h | usage                   Output this message"
	exit 1
}

start_env() {
	pnpx wp-env start
	configure_wp_env
}

stop_env() {
	pnpx wp-env stop
}

destroy_env() {
	pnpx wp-env stop
}

reset_env() {
	pnpx wp-env clean
	configure_wp_env
}

configure_wp_env() {
	pnpx wp-env run tests-wordpress ./wp-content/plugins/jetpack-boost-dev/tests/e2e/bin/container-setup.sh wp-config
	pnpx wp-env run tests-cli wp plugin activate e2e-bypass-jetpack-connection
	pnpx wp-env run tests-cli wp plugin activate jetpack-boost-dev
	pnpx wp-env run tests-cli wp plugin list

	echo
	echo "WordPress is ready!"
	echo
}

if [ "${1}" == "start" ]; then
	start_env
elif [ "${1}" == "stop" ]; then
	stop_env
elif [ "${1}" == "reset" ]; then
	reset_env
elif [ "${1}" == "destroy" ]; then
	destroy_env
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
