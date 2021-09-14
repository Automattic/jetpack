#!/bin/bash

# Exit if any command fails.
set -e

function usage {
	echo "usage: $0 command"
	echo "  start [--activate-plugins plugin1 plugin2 ...]    Setup the docker containers for E2E tests and optionally activate additional plugins"
	echo "  stop                                              Remove the docker containers for E2E tests"
	echo "  reset [--activate-plugins plugin1 plugin2 ...]    Reset the containers state and optionally activate additional plugins"
	echo "  gb-setup                                          Setup Gutenberg plugin"
	echo "  -h | usage                                        Output this message"
	exit 1
}

start_env() {
	pnpx jetpack docker --type e2e --name t1 up -d
	pnpx jetpack docker --type e2e --name t1 install
	configure_wp_env "$@"
}

stop_env() {
	pnpx jetpack docker --type e2e --name t1 -v down
}

reset_env() {
	pnpx jetpack docker --type e2e --name t1 wp -- db reset --yes
	pnpx jetpack docker --type e2e --name t1 install
	configure_wp_env "$@"
}

gb_setup() {
	GB_ZIP="wp-content/gutenberg.zip"
	pnpx jetpack docker --type e2e --name t1 exec-silent -- /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/container-setup.sh gb-setup $GB_ZIP
	pnpx jetpack docker --type e2e --name t1 wp plugin install $GB_ZIP
	pnpx jetpack docker --type e2e --name t1 wp plugin activate gutenberg
}

configure_wp_env() {
	pnpx jetpack docker --type e2e --name t1 wp plugin activate jetpack
	pnpx jetpack docker --type e2e --name t1 wp plugin activate e2e-plan-data-interceptor
	if [ "${1}" == "--activate-plugins" ]; then
		shift;
		for var in "$@"
		do
				pnpx jetpack docker --type e2e --name t1 wp plugin activate "$var"
		done
	fi
	pnpx jetpack docker --type e2e --name t1 wp option set permalink_structure ""

	echo
	echo "WordPress is ready!"
	echo
}

if [ "${1}" == "start" ]; then
	start_env "${@:2}"
elif [ "${1}" == "stop" ]; then
	stop_env
elif [ "${1}" == "reset" ]; then
	reset_env "${@:2}"
elif [ "${1}" == "gb-setup" ]; then
	gb_setup
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
