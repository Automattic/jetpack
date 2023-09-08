#!/bin/bash

echo "Uninstalling WordPress..."
echo "Emptying the WordPress DB..."
# Empty DB
wp --allow-root db reset --yes

echo
echo "Removing upload and upgrade folders..."
# Remove "uploads" and "upgrade" folders
rm -fr /var/www/html/wp-content/uploads /var/www/html/wp-content/upgrade

echo
echo "Emptying the WP debug log..."
# Empty WP debug log
truncate -s 0 /var/www/html/wp-content/debug.log

# Ensure wp-config.php doesn't have multi-site settings
echo
echo "Clearing out possible multi-site related changes..."
# Ensure we have single-site htaccess instead of multisite,
# just like we would have in fresh container.
cp -f /var/lib/jetpack-config/htaccess /var/www/html/.htaccess
{
	wp --allow-root config delete WP_ALLOW_MULTISITE
	wp --allow-root config delete MULTISITE
	wp --allow-root config delete SUBDOMAIN_INSTALL
	wp --allow-root config delete base
	wp --allow-root config delete DOMAIN_CURRENT_SITE
	wp --allow-root config delete PATH_CURRENT_SITE
	wp --allow-root config delete SITE_ID_CURRENT_SITE
	wp --allow-root config delete BLOG_ID_CURRENT_SITE
} 2>&1 | grep -v "not defined"

echo
echo "WordPress uninstalled. To install it again, run:"
echo
echo "  jetpack docker install"
echo
