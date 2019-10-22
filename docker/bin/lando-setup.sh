#!/bin/bash
set -e

[ -f $LANDO_WEBROOT/xmlrpc.php ] || wp core download

# Configure WordPress
if [ ! -f $LANDO_WEBROOT/wp-config.php ]; then
	echo "Creating wp-config.php ..."
	wp config create \
		--dbhost=database \
		--dbname=${MYSQL_DATABASE} \
		--dbuser=${MYSQL_USER} \
		--dbpass=${MYSQL_PASSWORD}

	echo "Setting other wp-config.php constants..."
	wp config set WP_DEBUG true --raw --type=constant
	wp config set WP_DEBUG_LOG true --raw --type=constant
	wp config set WP_DEBUG_DISPLAY false --raw --type=constant

	# Respecting Dockerfile-forwarded environment variables
	# Allow to be reverse-proxied from https
	wp config set "_SERVER['HTTPS']" "isset( \$_SERVER['HTTP_X_FORWARDED_PROTO'] ) && \$_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ? 'on' : NULL" \
		--raw \
		--type=variable

	# Allow this installation to run on http or https.
	wp config set DOCKER_REQUEST_URL \
		"( ! empty( \$_SERVER['HTTPS'] ) ? 'https://' : 'http://' ) . ( ! empty( \$_SERVER['HTTP_HOST'] ) ? \$_SERVER['HTTP_HOST'] : 'localhost' )" \
		--raw \
		--type=constant
	wp config set WP_SITEURL "DOCKER_REQUEST_URL" --raw --type=constant
	wp config set WP_HOME "DOCKER_REQUEST_URL" --raw --type=constant
fi

# If we don't have the wordpress test helpers, download them
if [ ! -d /tmp/wordpress-develop/tests ]; then
	# Get latest WordPress unit-test helper files
	svn co \
		https://develop.svn.wordpress.org/trunk/tests/phpunit/data \
		/tmp/wordpress-develop/tests/phpunit/data \
		--trust-server-cert \
		--non-interactive
	svn co \
		https://develop.svn.wordpress.org/trunk/tests/phpunit/includes \
		/tmp/wordpress-develop/tests/phpunit/includes \
		--trust-server-cert \
		--non-interactive
fi

# Create a wp-tests-config.php if there's none currently
if [ ! -f /tmp/wordpress-develop/wp-tests-config.php ]; then
	cp /tmp/wp-tests-config.php /tmp/wordpress-develop/wp-tests-config.php
fi
