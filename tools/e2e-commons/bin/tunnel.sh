#!/usr/bin/env bash

# Wrapper over tunnel.js script

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
	pm2 save --force
	pm2 start "$BASE_DIR"/../config/ecosystem.config.js
	pm2 save --force
	pm2 logs --nostream --lines 4
}

function down() {
	pm2 save --force
	pm2 delete "$BASE_DIR"/../config/ecosystem.config.js
	pm2 save --force
	NODE_ENV="test" node "$BASE_DIR"/tunnel.js off
}

function reset() {
	rm -rf config/tmp
	up
}

function logs() {
	pm2 logs --nostream --lines 10000 >"${1}"
}

case $1 in
	up)
		up
		;;
	down)
		down
		;;
	reset)
		reset
		;;
	logs)
		if [ -z "${2}" ]; then
			usage
		else
			logs "${2}"
		fi
		;;
	*)
		usage
		;;
esac
