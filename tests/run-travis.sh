#!/bin/bash

if [ "$WP_TRAVISCI" == "phpunit" ]; then

		echo "Linting PHP files..."
		find . \
			-not -path "./node_modules*" \
			-not -path "./tools*" \
			-not -path "./docker*" \
			-name \*.php \
			-exec php -l "{}" \;

    echo "Testing on WordPress master..."
    cd /tmp/wordpress-master/src/wp-content/plugins/$PLUGIN_SLUG
    if $WP_TRAVISCI; then
	# Everything is fine
	:
    else
        exit 1
    fi

    echo "Testing on WordPress stable..."
    cd /tmp/wordpress-latest/src/wp-content/plugins/$PLUGIN_SLUG
    if $WP_TRAVISCI; then
	# Everything is fine
	:
    else
        exit 1
    fi

    echo "Testing in Multisite mode on WordPress stable..."
    if WP_MULTISITE=1 $WP_TRAVISCI -c tests/php.multisite.xml; then
	# Everything is fine
	:
    else
        exit 1
    fi

    echo "Testing on WordPress stable minus one..."
    cd /tmp/wordpress-previous/src/wp-content/plugins/$PLUGIN_SLUG
    if $WP_TRAVISCI; then
	# Everything is fine
	:
    else
        exit 1
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
