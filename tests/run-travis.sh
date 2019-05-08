#!/bin/bash

echo "Travis CI command: $WP_TRAVISCI"

if [ "$WP_TRAVISCI" == "phpunit" ]; then

	# Run a external-html group tests
	if [ "$TRAVIS_EVENT_TYPE" == "cron" ]; then
		export WP_TRAVISCI="phpunit --group external-http"
	elif [[ "$TRAVIS_EVENT_TYPE" == "api" && ! -z $PHPUNIT_COMMAND_OVERRIDE ]]; then
		export WP_TRAVISCI="${PHPUNIT_COMMAND_OVERRIDE}"
	fi

	echo "Running \`$WP_TRAVISCI\` with:"
	echo " - $(phpunit --version)"
	echo " - WordPress mode: $WP_MODE"
	echo " - WordPress branch: $WP_BRANCH"

	# WP_BRANCH = master | latest | previous
	cd "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/$PLUGIN_SLUG"

	# WP_MODE = single | multi
	if [ "$WP_MODE" == "multi" ]; then
		# Test multi WP
		if WP_MULTISITE=1 $WP_TRAVISCI -c tests/php.multisite.xml; then
			# Everything is fine
			:
		else
			exit 1
		fi
		:
	else
		# Test single WP
		if $WP_TRAVISCI; then
			# Everything is fine
			:
		else
			exit 1
		fi
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
