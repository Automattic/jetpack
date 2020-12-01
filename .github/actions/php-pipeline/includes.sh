#!/bin/bash

function run_cmd {
	echo "Running command \`$@\`"

	if $@; then
		# Everything is fine
		:
	else
		exit 1
	fi
}

function print_build_info {
	echo
	echo "--------------------------------------------"
	echo "Running \`$CMD\` with:"
	echo " - $(phpunit --version)"
	echo " - WordPress branch: $WP_BRANCH"
	if [ "master" == "$WP_BRANCH" ]; then
		echo " - Because WordPress is in master branch, will also attempt to test multisite."
	fi
	echo "--------------------------------------------"
	echo
}
