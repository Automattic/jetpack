#!/bin/bash

# Exit if any command fails.
set -eo pipefail

#####
# This script is designed to be running inside the WP container
# it is basically a hacky way to insert arbitrary PHP code into wp-config without messing with bash escaping etc.
# Also, it creates a debug log file

function usage {
	echo "usage: $0 command"
	echo "  wp-setup                     Setup wp-config"
	echo "  gb-setup                     Set up Gutenberg plugin"
	echo "  -h | usage                   Output this message"
	exit 1
}

function wp_config {
	touch wp-content/debug.log
	chown www-data:www-data wp-content/debug.log
	chmod 755 wp-content/debug.log

	# Remove default config entries
	sed -i '/WP_SITEURL/d' wp-config.php
	sed -i '/WP_HOME/d' wp-config.php
	sed -i '/WP_TESTS_DOMAIN/d' wp-config.php
	sed -i '/E2E_REQUEST_URL/d' wp-config.php

	sed -i "/\/\* That's all, stop editing! Happy publishing. \*\//i\
	define( 'E2E_REQUEST_URL', ( ! empty( \\\$_SERVER['HTTPS'] ) ? 'https://' : 'http://' ) . ( ! empty( \\\$_SERVER['HTTP_HOST'] ) ? \\\$_SERVER['HTTP_HOST'] : 'localhost' ) );\n\
	define( 'WP_SITEURL', E2E_REQUEST_URL );\n\
	define( 'WP_HOME', E2E_REQUEST_URL );\n\
	" wp-config.php
}

function gb_setup {
	ZIP_PATH=${1}
	GB_URL=$(curl -s https://api.github.com/repos/Wordpress/gutenberg/releases/latest | grep browser_download_url | cut -d '"' -f 4)

	rm -rf $ZIP_PATH wp-content/plugins/gutenberg
	curl -L $GB_URL --output $ZIP_PATH
	echo "Latest pre-release Gutenberg successfuly downloaded in $ZIP_PATH"
}

if [ "${1}" == "wp-config" ]; then
	wp_config
elif [ "${1}" == "gb-setup" ]; then
	gb_setup ${2}
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
