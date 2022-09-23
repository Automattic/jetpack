#!/usr/bin/env bash

# Exit if any command fails.
set -e

BASE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$BASE_DIR/../node_modules/.bin:$PATH"

usage() {
	echo "usage: $0 command"
	echo "  start [--activate-plugins plugin1 plugin2 ...]    Setup the docker containers for E2E tests and optionally activate additional plugins"
	echo "  stop                                              Stop the docker containers for E2E tests"
	echo "  reset [--activate-plugins plugin1 plugin2 ...]    Reset the containers state (reset db, re-installs WordPress) and optionally activate additional plugins"
	echo "  clean                                             Completely resets the environment (remove docker volumes, MySql and WordPress data and logs)"
	echo "  new [--activate-plugins plugin1 plugin2 ...]      Completely resets the running environment and starts a new fresh one"
	echo "  gb-setup                                          Setup Gutenberg plugin"
	echo "  -h | usage                                        Output this message"
	exit 1
}

BASE_CMD='pnpm jetpack docker --type e2e --name t1'

start_env() {
	$BASE_CMD up -d
	$BASE_CMD install || true
	configure_wp_env "$@"
}

stop_env() {
	$BASE_CMD down
}

reset_env() {
	$BASE_CMD wp -- db reset --yes
	$BASE_CMD install || true
	configure_wp_env "$@"
}

clean_env() {
	$BASE_CMD uninstall || true
	$BASE_CMD clean
}

new_env() {
	clean_env
	start_env "$@"
}

gb_setup() {
	GB_ZIP="wp-content/gutenberg.zip"
	$BASE_CMD exec-silent -- /usr/local/src/jetpack-monorepo/tools/e2e-commons/bin/container-setup.sh gb-setup $GB_ZIP
	$BASE_CMD wp plugin install $GB_ZIP
	$BASE_CMD wp plugin activate gutenberg
}

configure_wp_env() {
	$BASE_CMD wp plugin activate jetpack
	$BASE_CMD wp plugin activate e2e-plan-data-interceptor
	$BASE_CMD wp plugin activate e2e-waf-data-interceptor
	$BASE_CMD wp plugin activate e2e-search-test-helper
	if [ "${1}" == "--activate-plugins" ]; then
		shift
		for var in "$@"; do
			# shellcheck disable=SC2086
			pnpm $BASE_CMD wp plugin activate "$var"
		done
	fi
	$BASE_CMD wp option set permalink_structure ""
	$BASE_CMD wp jetpack module deactivate sso
	$BASE_CMD wp theme activate twentytwentyone

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
elif [ "${1}" == "clean" ]; then
	clean_env
elif [ "${1}" == "new" ]; then
	new_env "${@:2}"
elif [ "${1}" == "gb-setup" ]; then
	gb_setup
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
