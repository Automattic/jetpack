#!/bin/bash

# Empty DB
wp db reset --yes

# Ensure we have single-site htaccess instead of multisite
cp -f /var/configs/htaccess /var/www/html/.htaccess

# Empty uploads and upgrade folders
rm -fr /var/www/html/wp-content/uploads /var/www/html/wp-content/upgrade

# Empty WP debug log
truncate -s 0 /var/www/html/wp-content/debug.log

# Ensure wp-config.php doesn't have multi-site settings
wp config delete WP_ALLOW_MULTISITE
wp config delete MULTISITE
wp config delete SUBDOMAIN_INSTALL
wp config delete base
wp config delete DOMAIN_CURRENT_SITE
wp config delete PATH_CURRENT_SITE
wp config delete SITE_ID_CURRENT_SITE
wp config delete BLOG_ID_CURRENT_SITE

echo "WordPress uninstalled."
