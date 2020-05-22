#!/bin/bash

echo "Travis CI command: $WP_TRAVISCI"

if [ "$WP_TRAVISCI" == "phpunit" ]; then

	echo "Running phpunit with:"
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

	gem install sass
	gem install compass
	yarn

	if $WP_TRAVISCI; then
		# Everything is fine
		:
	else
		exit 1
	fi
fi

exit 0
