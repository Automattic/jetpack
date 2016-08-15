#!/bin/bash

if [ "$WP_TRAVISCI" == "phpunit" ]; then

    echo "Testing on WordPress master..."
    cd /tmp/wordpress-master/src/wp-content/plugins/$PLUGIN_SLUG
    $WP_TRAVISCI

    if [ $? -ne 0 ]; then
        exit $?
    fi
    
    echo "Testing on WordPress stable..."
    cd /tmp/wordpress-latest/src/wp-content/plugins/$PLUGIN_SLUG
    $WP_TRAVISCI

    if [ $? -ne 0 ]; then
        exit $?
    fi

    echo "Testing in Multisite mode on WordPress stable..."
    WP_MULTISITE=1 $WP_TRAVISCI -c tests/php.multisite.xml

    if [ $? -ne 0 ]; then
        exit $?
    fi

    echo "Testing uninstallation suite on WordPress stable..."
    $WP_TRAVISCI --group=uninstall --testsuite=uninstall

    if [ $? -ne 0 ]; then
        exit $?
    fi

    echo "Testing on WordPress stable minus one..."
    cd /tmp/wordpress-previous/src/wp-content/plugins/$PLUGIN_SLUG
    $WP_TRAVISCI

    if [ $? -ne 0 ]; then
        exit $?
    fi
else

    gem install sass
    gem install compass
    npm install -g npm
    npm install -g gulp-cli
    npm install

    $WP_TRAVISCI

    if [ $? -ne 0 ]; then
        exit $?
    fi
fi

exit 0
