#!/bin/bash
set -e

# This file is run for the Docker image defined in Dockerfile.
# These commands will be run each time the container is run.
#
# If you modify anything here, remember to build the image again by running:
# yarn docker:build

# Configure PHP
PHP_ERROR_REPORTING=${PHP_ERROR_REPORTING:-"E_ALL"}
sed -ri 's/^display_errors\s*=\s*Off/display_errors = On/g' /etc/php/7.0/apache2/php.ini
sed -ri 's/^display_errors\s*=\s*Off/display_errors = On/g' /etc/php/7.0/cli/php.ini
sed -ri "s/^error_reporting\s*=.*$//g" /etc/php/7.0/apache2/php.ini
sed -ri "s/^error_reporting\s*=.*$//g" /etc/php/7.0/cli/php.ini
echo "error_reporting = $PHP_ERROR_REPORTING" >> /etc/php/7.0/apache2/php.ini
echo "error_reporting = $PHP_ERROR_REPORTING" >> /etc/php/7.0/cli/php.ini

# Download WordPress
cd /var/www/ && [ -f /var/www/xmlrpc.php ] || wp --allow-root core download

# Configure WordPress
if [ ! -f /var/www/wp-config.php ]; then
	echo "Creating wp-config.php ..."
	# Loop until wp cli exits with 0
	# because if running the containers for the first time,
	# the mysql container will reject connections until it has set the database data
	# See "No connections until MySQL init completes" in https://hub.docker.com/_/mysql/
	times=15
	i=1
	while [ "$i" -le "$times" ]; do
		sleep 3
		wp --allow-root config create \
			--dbhost=$WORDPRESS_DB_HOST \
			--dbname=wordpress \
			--dbuser=$WORDPRESS_DB_USER \
			--dbpass=$WORDPRESS_DB_PASSWORD \
			&& break
		[ ! $? -eq 0 ] || break;
		echo "Waiting for creating wp-config.php until mysql is ready to receive connections"
		(( i++ ))
	done

    echo "Setting other wp-config.php constants..."
    wp --allow-root config set WP_DEBUG true --raw --type=constant
    wp --allow-root config set WP_DEBUG_LOG true --raw --type=constant
    wp --allow-root config set WP_DEBUG_DISPLAY false --raw --type=constant

    # Respecting Dockerfile-forwarded environment variables
    wp --allow-root config set DOCKER_REQUEST_URL \
		  "( ! empty( \$_SERVER['HTTPS'] ) ? 'https://' : 'http://' ) . ( ! empty( \$_SERVER['HTTP_HOST'] ) ? \$_SERVER['HTTP_HOST'] : 'localhost' )" \
			--raw \
			--type=constant
    wp --allow-root config set WP_SITEURL "DOCKER_REQUEST_URL" --raw --type=constant
    wp --allow-root config set WP_HOME "DOCKER_REQUEST_URL" --raw --type=constant
fi

# Copy single site htaccess if none is present
if [ ! -f /var/www/.htaccess ]; then
	cp /tmp/htaccess /var/www/.htaccess
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

# Run apache in the foreground so the container keeps running

echo "Starting Apache in the foreground"
apachectl -D FOREGROUND
