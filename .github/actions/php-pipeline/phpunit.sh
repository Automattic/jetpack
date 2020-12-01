#!/bin/bash

export CMD=phpunit

function run_packages_tests {
	export CMD_PACKAGES="composer phpunit"
	export PACKAGES='./packages/**/tests/php'
	for PACKAGE in $PACKAGES
	do
		if [ -d "$PACKAGE" ]; then
			cd "$PACKAGE/../.."
			export NAME=$(basename $(pwd))

			if [ ! -e tests/php/travis-can-run.sh ] || tests/php/travis-can-run.sh; then
				echo "Running \`$CMD_PACKAGES\` for package \`$NAME\` "
				run_cmd $CMD_PACKAGES
			fi
			cd ../..
		fi
	done
}

print_build_info

# Run package tests only for the latest WordPress branch, because the
# tests are independent of the version.
if [ "latest" == "$WP_BRANCH" ]; then
	run_packages_tests
fi

if [ "$LEGACY_FULL_SYNC" == "1" ]; then
	export CMD="phpunit --group=legacy-full-sync"
fi


# WP_BRANCH = master | latest | previous
cd "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/jetpack"

if [ "$WP_BRANCH" == "master" ]; then
	# Test multi WP in addition to single, but only in master branch mode.
	run cmd WP_MULTISITE=1 $CMD -c tests/php.multisite.xml
fi

run_cmd $CMD

exit 0
