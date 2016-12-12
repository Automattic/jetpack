#!/bin/bash

if [ "$WP_TRAVISCI" == "phpunit" ]; then

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
    npm install -g npm
    npm install -g gulp-cli
    npm install

    if $WP_TRAVISCI; then
	# Everything is fine
	:
    else
        exit 1
    fi
fi

exit 0
