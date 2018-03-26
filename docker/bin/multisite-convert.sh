#!/bin/bash

if ! $(wp --allow-root core is-installed); then
	echo
	echo "WordPress has to be installed first. To install, run:"
	echo
	echo "  yarn docker:install"
	echo
	exit 1;
fi

# Do the conversion, requires WP installed
wp --allow-root core multisite-convert

# Update domain to wp-config.php
wp --allow-root config set DOMAIN_CURRENT_SITE "${WP_DOMAIN:-localhost}" --type=constant

# Use multisite htaccess template
cp -f /var/configs/htaccess-multi /var/www/html/.htaccess

# Update domain to DB
wp --allow-root db query "UPDATE wp_blogs SET domain='${WP_DOMAIN:-localhost}' WHERE blog_id=1;"

echo "WordPress converted to a multisite."
