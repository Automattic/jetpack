#!/bin/bash

function run_packages_tests {
	echo "Running \`$WP_TRAVISCI\` for Packages:"
	export WP_TRAVISCI_PACKAGES="composer phpunit"
	export PACKAGES='./packages/**/tests/php'
	for PACKAGE in $PACKAGES
	do
		if [ -d "$PACKAGE" ]; then
			cd "$PACKAGE/../.."
			echo "Running \`$WP_TRAVISCI_PACKAGES\` for package \`$PACKAGE\` "

			if $WP_TRAVISCI_PACKAGES; then
				# Everything is fine
				:
			else
				exit 1
			fi
			cd ../..
		fi
	done
}

echo "Travis CI command: $WP_TRAVISCI"

if [ "$WP_TRAVISCI" == "phpunit" ]; then

	# Run package tests only for the latest WordPress branch, because the
	# tests are independent of the version.
	if [ "latest" == "$WP_BRANCH" ]; then
		run_packages_tests
	fi

	# Run a external-html group tests
	if [ "$TRAVIS_EVENT_TYPE" == "cron" ]; then
		export WP_TRAVISCI="phpunit --group external-http"
	elif [[ "$TRAVIS_EVENT_TYPE" == "api" && ! -z $PHPUNIT_COMMAND_OVERRIDE ]]; then
		export WP_TRAVISCI="${PHPUNIT_COMMAND_OVERRIDE}"
	fi

	echo "Running \`$WP_TRAVISCI\` with:"
	echo " - $(phpunit --version)"
	echo " - WordPress branch: $WP_BRANCH"
	if [ "master" == "$WP_BRANCH" ]; then
		echo " - Because WordPress is in master branch, will also attempt to test multisite."
	fi

	# WP_BRANCH = master | latest | previous
	cd "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$PLUGIN_SLUG"

	if [ "$WP_BRANCH" == "master" ]; then
		# Test multi WP in addition to single, but only in master branch mode.
		if WP_MULTISITE=1 $WP_TRAVISCI -c tests/php.multisite.xml; then
			# Everything is fine
			:
		else
			exit 1
		fi
		:
	fi

	# Test single WP
	if $WP_TRAVISCI; then
		# Everything is fine
		:
	else
		exit 1
	fi

else
	# Run linter/tests
	if $WP_TRAVISCI; then
		# Everything is fine
		:
	else
		exit 1
	fi
fi

exit 0
