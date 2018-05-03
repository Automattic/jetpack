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
	--url=${WP_DOMAIN} \
	--title="${WP_TITLE}" \
	--admin_user=${WP_ADMIN_USER} \
	--admin_password=${WP_ADMIN_PASSWORD} \
	--admin_email=${WP_ADMIN_EMAIL} \
	--skip-email

# Set the site hidden from search engines
# https://codex.wordpress.org/Option_Reference#Privacy
wp --allow-root option update blog_public 0

# Install Query Monitor plugin
# https://wordpress.org/plugins/query-monitor/
wp --allow-root plugin install query-monitor --activate

# Activate Jetpack
wp --allow-root plugin activate jetpack

echo
echo "WordPress installed. Open ${WP_DOMAIN}"
echo
