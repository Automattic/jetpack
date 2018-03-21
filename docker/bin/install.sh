#!/bin/bash

cd /var/www/html

if $(wp core is-installed); then
	echo "WordPress has already been installed. Uninstall it first by running:"
	echo "  yarn docker:uninstall"
	exit 1;
fi

# Install WP core
wp core install \
	--url=${WP_URL:-localhost} \
	--title=${WP_TITLE:-HelloWord} \
	--admin_user=${WP_ADMIN_USER:-wordpress} \
	--admin_password=${WP_ADMIN_PASSWORD:-wordpress} \
	--admin_email=${WP_ADMIN_EMAIL:-wordpress@example.com} \
	--skip-email

# Install Query Monitor plugin
# https://wordpress.org/plugins/query-monitor/
wp plugin install query-monitor --activate

# Activate Jetpack
wp plugin activate jetpack

echo "WordPress installed."
