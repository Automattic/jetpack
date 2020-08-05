#!/bin/bash

##
# Add error message formatting to a string, and echo it.
#
# @param {string} message The string to add formatting to.
##
error_message() {
	echo -en "\033[31mERROR\033[0m: $1"
}

##
# Add warning message formatting to a string, and echo it.
#
# @param {string} message The string to add formatting to.
##
warning_message() {
	echo -en "\033[33mWARNING\033[0m: $1"
}

##
# Add status message formatting to a string, and echo it.
#
# @param {string} message The string to add formatting to.
##
status_message() {
	echo -en "\033[32mSTATUS\033[0m: $1"
}

##
# Check if the command exists as some sort of executable.
#
# The executable form of the command could be an alias, function, builtin, executable file or shell keyword.
#
# @param {string} command The command to check.
#
# @return {bool} Whether the command exists or not.
##
command_exists() {
	type "$1" > /dev/null 2>&1
}

check_for_jq() {
	if $(command_exists "jq"); then
			return
	fi

	echo -e $(error_message " jq is not installed. Please install it before moving forward. Instructions: https://stedolan.github.io/jq/download/")
	exit 1
}

# check if ngrok is installed
check_for_ngrok() {
	if $(command_exists "ngrok"); then
			NGROK_CMD="ngrok"
			return
	fi

	if [ -z "$CI" ]; then
		echo -e $(error_message "Please install ngrok on your machine. Instructions: https://ngrok.com/download")
		exit 1
	fi

	echo -e $(status_message "Installing ngrok in CI...")
	curl -s https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip > ngrok.zip
	unzip -o ngrok.zip
	NGROK_CMD="./ngrok"
}

# Starts ngrok tunnel. Uses ngrok auth key if available as `$NGROK_KEY`
start_ngrok() {
	echo -e $(status_message "Starting ngrok...")
	# Killing any rogue ngrok instances just in case
	kill_ngrok

	if [ ! -z "$NGROK_KEY" ]; then
			$NGROK_CMD authtoken $NGROK_KEY
	fi

	$NGROK_CMD http -log=stdout 8889 > /dev/null &
	sleep 3
	WP_SITE_URL=$(get_ngrok_url)

	if [ -z "$WP_SITE_URL" ]; then
		echo -e $(error_message "WP_SITE_URL is not set after launching an ngrok")
		exit 1
	fi
}

# Removes all opened tunnels and starts a new one
restart_ngrok() {
	echo -e $(status_message "Resetting ngrok...")
	curl -X "DELETE" localhost:4040/api/tunnels/command_line
	curl -X "DELETE" "localhost:4040/api/tunnels/command_line%20(http)"

	curl -X POST -H "Content-Type: application/json" -d '{"name":"command_line","addr":"http://localhost:8889","proto":"http"}' localhost:4040/api/tunnels

	sleep 3
	WP_SITE_URL=$(get_ngrok_url)
}

get_ngrok_url() {
	echo $(curl -s localhost:4040/api/tunnels/command_line | jq --raw-output .public_url)
}

# terminates ngrok process
kill_ngrok() {
	ps aux | grep -i ngrok | awk '{print $2}' | xargs kill -9 || true
}

start_env() {
	yarn wp-env start

	check_for_ngrok
	check_for_jq
	start_ngrok

	configure_wp_env
}

reset_env() {
	yarn wp-env clean
	restart_ngrok

	configure_wp_env
}

configure_wp_env() {
	yarn wp-env run tests-wordpress touch wp-content/debug.log

	yarn wp-env run tests-cli wp option set siteurl "$WP_SITE_URL"
	yarn wp-env run tests-cli wp option set home "$WP_SITE_URL"

	if [ -n "$LATEST_GUTENBERG" ]; then
		yarn wp-env run tests-cli wp plugin install gutenberg --activate
	fi

	yarn wp-env run tests-cli wp plugin activate jetpack-dev

	echo
	status_message "Open ${WP_SITE_URL} to see your site!"
	echo
}


