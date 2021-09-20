#!/bin/bash

# Exit if any command fails.
set -eo pipefail

#####
# This script is designed to be running inside the WP container

function usage {
	echo "usage: $0 command"
	echo "  gb-setup                     Set up Gutenberg plugin"
	echo "  -h | usage                   Output this message"
	exit 1
}

function gb_setup {
	ZIP_PATH=${1}
	GB_URL=$(curl -s https://api.github.com/repos/Wordpress/gutenberg/releases/latest | grep browser_download_url | cut -d '"' -f 4)

	rm -rf $ZIP_PATH wp-content/plugins/gutenberg
	curl -L $GB_URL --output $ZIP_PATH
	echo "Latest pre-release Gutenberg successfuly downloaded in $ZIP_PATH"
}

if [ "${1}" == "gb-setup" ]; then
	gb_setup ${2}
elif [ "${1}" == "usage" ]; then
	usage
else
	usage
fi
