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

start_env() {
	yarn wp-env start

	# Hacky way to insert PHP code into a wp-config file
	# It takes care of different tunnel subdomains
	cat <<EOT > e2e-wp-config-update.sh
#!/bin/bash

touch wp-content/debug.log
chown www-data:www-data wp-content/debug.log

sed -i "/\/\* That's all, stop editing! Happy publishing. \*\//i\
define( 'E2E_REQUEST_URL', ( ! empty( \\\$_SERVER['HTTPS'] ) ? 'https://' : 'http://' ) . ( ! empty( \\\$_SERVER['HTTP_HOST'] ) ? \\\$_SERVER['HTTP_HOST'] : 'localhost' ) );\n\
define( 'WP_SITEURL', E2E_REQUEST_URL );\n\
define( 'WP_HOME', E2E_REQUEST_URL );\n\
" wp-config.php
EOT

	yarn wp-env run tests-wordpress sh wp-content/plugins/jetpack-dev/e2e-wp-config-update.sh

	configure_wp_env
}

reset_env() {
	yarn wp-env clean
	configure_wp_env
}

configure_wp_env() {
	if [ -n "$LATEST_GUTENBERG" ]; then
		yarn wp-env run tests-cli wp plugin install gutenberg --activate
	fi

	yarn wp-env run tests-cli wp plugin activate jetpack-dev

	echo
	status_message "Open ${WP_SITE_URL} to see your site!"
	echo
}


