#!/bin/bash
set -e

# This file is the entrypoin for the docker image defined in Dockerfile.
# These commands will be run each time the container is run.
#

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
    wp --allow-root config create \
      --dbhost=$WORDPRESS_DB_HOST \
      --dbname=wordpress \
      --dbuser=$WORDPRESS_DB_USER \
      --dbpass=$WORDPRESS_DB_PASSWORD

    echo "Setting other wp-config.php constants..."
    wp --allow-root config set WP_DEBUG true --raw --type=constant
    wp --allow-root config set WP_DEBUG_LOG true --raw --type=constant
    wp --allow-root config set WP_DEBUG_DISPLAY false --raw --type=constant

    # Respecting Dockerfile-forwarded environment variables
    wp --allow-root config set DOCKER_REQUEST_URL "(\$_SERVER['HTTPS'] ? 'https://' : 'http://') . \$_SERVER['HTTP_HOST']" --raw --type=constant
    wp --allow-root config set WP_SITEURL "\$DOCKER_REQUEST_URL" --raw --type=constant
    wp --allow-root config set WP_HOME "\$DOCKER_REQUEST_URL" --raw --type=constant
fi
# Change ownership of /var/www to www-data
# chown -R www-data:www-data /var/www

# Run apache in the foreground so the container keeps running

echo "Starting Apache in the foreground"
apachectl -D FOREGROUND
