#!/usr/bin/env bash

# Wrapper over tunnel.cjs script

set -e

function usage() {
	echo
	echo "usage: $(basename "$0") <command>"
	echo
	echo "Commands:"
	echo "up	Starts a new tunnel. Resets an existing tunnel process and overrides the used URL"
	echo "down	Stops an existing tunnel process"
	echo "reset	Resets an existing tunnel process and creates a new tunnel URL"
	echo "help	Show this message"
	echo
	exit 1
}

BASE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$BASE_DIR/../node_modules/.bin:$PATH"

function up() {
	down
	node "$BASE_DIR"/tunnel.cjs on "$@"
}

function down() {
	node "$BASE_DIR"/tunnel.cjs off
}

function reset() {
	down
	rm -rf config/tmp
	up
}

case $1 in
	up)
		shift
		up "$@"
		;;
	down)
		down
		;;
	reset)
		reset
		;;
	*)
		usage
		;;
esac
