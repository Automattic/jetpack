#!/bin/bash

if wp --allow-root core is-installed; then
	echo
	echo "WordPress has already been installed. Uninstall it first by running:"
	echo
	echo "  jetpack docker uninstall"
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

# Discourage search engines from indexing. Can be changed via UI in Settings->Reading.
wp --allow-root option update blog_public 0

if [ "$COMPOSE_PROJECT_NAME" == "jetpack_dev" ] ; then
	# Add editor, author, contributor, and subscriber users
	roles=("author" "editor" "subscriber" "contributor")

	# Loop through the array and run the command for each role
	for role in "${roles[@]}"; do
		echo "Creating user: $role"
		# Silence output to avoid extra noise in the terminal. It would only output the user ID at the quietest level.
		wp --allow-root user create "$role" "$role"@example.com --role="$role" >> /dev/null 2>&1
	done

	# Install Query Monitor plugin
	# https://wordpress.org/plugins/query-monitor/
	wp --allow-root plugin install query-monitor --activate

	# Install WP-Control
	# https://wordpress.org/plugins/wp-crontrol/
	wp --allow-root plugin install wp-crontrol --activate

	# Install Gutenberg
	# https://wordpress.org/plugins/gutenberg/
	wp --allow-root plugin install gutenberg --activate

	# Install User Switching
	# https://wordpress.org/plugins/user-switching/
	wp --allow-root plugin install user-switching --activate

	# Intentionally not auto-updating Akismet since we may be wanting to test that with a specific version.
	wp --allow-root plugin auto-updates enable query-monitor wp-crontrol gutenberg user-switching
fi

# Activate Jetpack
wp --allow-root plugin activate jetpack

echo
echo "WordPress installed. Open ${WP_DOMAIN}"
echo
