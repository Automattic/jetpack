#!/bin/bash

if $(wp --allow-root core is-installed); then
	echo
	echo "WordPress has already been installed. Uninstall it first by running:"
	echo
	echo "  yarn docker:uninstall"
	echo
	exit 1;
fi

# Install WP core
wp --allow-root core install \
	--url=${WP_DOMAIN:-localhost} \
	--title=${WP_TITLE:-HelloWord} \
	--admin_user=${WP_ADMIN_USER:-wordpress} \
	--admin_password=${WP_ADMIN_PASSWORD:-wordpress} \
	--admin_email=${WP_ADMIN_EMAIL:-wordpress@example.com} \
	--skip-email

# Install Query Monitor plugin
# https://wordpress.org/plugins/query-monitor/
wp --allow-root plugin install query-monitor --activate

# Activate Jetpack
wp --allow-root plugin activate jetpack

echo "WordPress installed."
