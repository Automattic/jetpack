#!/usr/bin/env bash

# E2E test setup uses these to supply the username and password the E2Es are expecting, instead of what was set in default.env or .env.
[[ -n "$WP_FORCE_ADMIN_USER" ]] && WP_ADMIN_USER="$WP_FORCE_ADMIN_USER"
[[ -n "$WP_FORCE_ADMIN_PASS" ]] && WP_ADMIN_PASSWORD="$WP_FORCE_ADMIN_PASS"

# If WordPress is still downloading, we can't yet run this script.
if [[ ! -f wp-config.php ]]; then
	echo 'The WordPress install is incomplete! Perhaps it is still downloading?'
	echo 'If you continue to have issues, restart the container.'
	exit
fi

if wp core is-installed; then
	echo
	echo 'WordPress is already installed. To start over, first run the following:'
	echo
	echo '  jetpack docker uninstall'
	echo
	exit
fi

# Build the install URL, appending HOST_PORT when it's not the default 80.
WP_URL="http://${WP_DOMAIN}"
if [[ -n "$HOST_PORT" && "$HOST_PORT" != "80" ]]; then
	WP_URL="${WP_URL}:${HOST_PORT}"
fi

# Install WP core
echo 'Configuring WordPress...'
wp core install \
	--url="${WP_URL}" \
	--title="${WP_TITLE}" \
	--admin_user="${WP_ADMIN_USER}" \
	--admin_password="${WP_ADMIN_PASSWORD}" \
	--admin_email="${WP_ADMIN_EMAIL}" \
	--skip-email\
	--quiet

# Discourage search engines from indexing. Can be changed via UI in Settings->Reading.
echo 'Discourage search engine indexing...'
wp option update blog_public 0 --quiet

# We don't do the following for E2E test environments.
if [[ "$COMPOSE_PROJECT_NAME" == "jetpack_dev" ]] ; then
	echo "Configuring users..."
	roles=("author" "editor" "subscriber" "contributor")
	for role in "${roles[@]}"; do
		wp user exists "$role" --quiet || {
			user_id=$(wp user create "$role" "$role"@example.com --role="$role" --porcelain)
			echo "    Created new user: $role ($user_id)"
		}
	done

	echo "Configuring third-party plugins..."
	extra_plugins=(
		"gutenberg"      # https://wordpress.org/plugins/gutenberg/
		"query-monitor"  # https://wordpress.org/plugins/query-monitor/
		"user-switching" # https://wordpress.org/plugins/user-switching/
		"wp-crontrol"    # https://wordpress.org/plugins/wp-crontrol/
	)
	for plugin_slug in "${extra_plugins[@]}"; do
		wp plugin is-installed "$plugin_slug" || wp plugin install "$plugin_slug" | sed 's/^/    /'
		wp plugin is-active "$plugin_slug" || wp plugin activate "$plugin_slug" | sed 's/^/    /'
		status=$(wp plugin auto-updates status "$plugin_slug" --field=status --quiet)
		[[ "$status" == 'enabled' ]] || wp plugin auto-updates enable "$plugin_slug" | sed 's/^/    /'
		echo "    $plugin_slug: ✅"
	done
fi

# Activate Jetpack as needed
echo "Ensuring Jetpack is active..."
wp plugin is-active jetpack || wp plugin activate jetpack | sed 's/^/    /'

echo
echo 'Your site is ready! You can see it here:'
echo
echo "    ${WP_URL}"
echo
