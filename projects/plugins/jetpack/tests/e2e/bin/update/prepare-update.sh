#!/bin/bash

set -e

# This script runs all the steps to prepare for a Jetpack plugin update
# This should run inside the Docker container with the WordPress instance
# =======================================================================

if [ -z "${1}" ]; then
	echo "ERROR: Missing argument site url"
	echo "usage: $0 URL"
	exit 1
fi

VERSION="99.9-alpha"

printf "\nDeactivating Jetpack\n"
wp plugin --allow-root deactivate jetpack || true

printf "\nRemoving Jetpack plugins\n"
# shellcheck disable=SC2012
ls -d /usr/local/src/jetpack-monorepo/projects/plugins/*/ | while read -r path; do
	PLUGIN_PATH="/var/www/html/wp-content/plugins/$(basename "$path")"
	printf "Removing %s\n" "$PLUGIN_PATH"
	rm -rf "$PLUGIN_PATH" || true
done

printf "\nInstalling Jetpack stable\n"
wp plugin --allow-root install --activate jetpack

printf "\nSetting the update version and URL\n"
wp plugin --allow-root activate e2e-plugin-updater
wp --allow-root option set e2e_jetpack_upgrader_update_version "$VERSION"
wp --allow-root option set e2e_jetpack_upgrader_plugin_url "${1}"/wp-content/uploads/jetpack-next.zip
rm -rf /root/.wp-cli/cache/plugin/jetpack-"$VERSION".zip

# Update FS permissions
sudo chmod 755 /var/www/html
sudo chown -R www-data:www-data /var/www/html

printf "\nReady for update!\n"
