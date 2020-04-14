#!/bin/bash

# Exit if any command fails
set -e

# Set up environment variables
. "$(dirname "$0")/bootstrap-env.sh"

# Include useful functions
. "$(dirname "$0")/includes.sh"

function usage {
	echo "usage: $0 command"
	echo "  setup                        Setup the docker containers for E2E tests"
	echo "  reset                        Reset the containers state"
	echo "  stop                         Stops the containers"
	echo "  db_reset                     Reset the site DB"
	echo "  sh                           sh into the container"
	echo "  cli \"subcommand\"             run a wp-cli command"
	echo "  -h | usage                   output this message"
	exit 1
}

FILES=${1-.}
E2E_DEBUG=${2-true}
WP_BASE_URL=${3-$(get_ngrok_url)}
PUPPETEER_HEADLESS=${3-false}

CLI="cli_e2e_tests"
CONTAINER='wordpress_e2e_tests'

if [ "${1}" == "setup" ]; then
	setup_env
elif [ "${1}" == "reset" ]; then
	reset_env
elif [ "${1}" == "stop" ]; then
	stop_docker
elif [ "${1}" == "db_reset" ]; then
	$DC run --rm -u 33 $CLI db reset
elif [ "${1}" == "sh" ]; then
	$DC exec $CONTAINER bash
elif [ "${1}" == "cli" ]; then
	$DC run --rm -u 33 $CLI ${2}
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
