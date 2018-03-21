#!/bin/bash

if ! $(wp core is-installed); then
	echo "WordPress has to be installed first. To install, run:"
	echo "  yarn docker:install"
	exit 1;
fi

# Do the conversion, requires WP installed
wp core multisite-convert

# Update domain to wp-config.php
wp config set DOMAIN_CURRENT_SITE "${WP_URL:-localhost}" --type=constant

# Use multisite htaccess template
cp -f /var/configs/htaccess-multi /var/www/html/.htaccess

# Update domain to DB
wp db query "UPDATE wp_blogs SET domain='${WP_URL:-localhost}' WHERE blog_id=1;"

echo "WordPress converted to a multisite."
