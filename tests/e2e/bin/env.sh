#!/bin/bash

# Exit if any command fails.
set -e

. "$(dirname "$0")/includes.sh"

function usage {
	echo "usage: $0 command"
	echo "  start                        Setup the docker containers for E2E tests"
	echo "  reset                        Reset the containers state"
	# echo "  stop                         Stops the containers"
	# echo "  db_reset                     Reset the site DB"
	# echo "  sh                           sh into the container"
	# echo "  ct                           run arbitrary shell command in main container"
	# echo "  cli \"subcommand\"             run a wp-cli command"
	echo "  -h | usage                   output this message"
	exit 1
}

if [ "${1}" == "start" ]; then
	setup_env
elif [ "${1}" == "reset" ]; then
	reset_env
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
