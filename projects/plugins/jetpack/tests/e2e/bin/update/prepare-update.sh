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

printf "\nDeactivating Jetpack and removing any related plugins\n"
wp plugin --allow-root deactivate jetpack || true
rm -rf /var/www/html/wp-content/plugins/jetpack || true
rm -rf /var/www/html/wp-content/plugins/boost || true
rm -rf /var/www/html/wp-content/plugins/beta || true
rm -rf /var/www/html/wp-content/plugins/debug-helper || true
rm -rf /var/www/html/wp-content/plugins/backup || true
rm -rf /var/www/html/wp-content/plugins/vaultpress || true

printf "\nDone with jetpack.zip preparation!\n"

printf "\nInstalling Jetpack stable\n"
wp plugin --allow-root install --activate jetpack

printf "\nSetting the update version and URL\n"
wp plugin --allow-root activate e2e-plugin-updater
wp --allow-root option set e2e_jetpack_upgrader_update_version "$VERSION"
wp --allow-root option set e2e_jetpack_upgrader_plugin_url "${1}"/wp-content/uploads/jetpack-next.zip
rm -rf /root/.wp-cli/cache/plugin/jetpack-"$VERSION".zip

# Update FS permissions
ls -lh /var/www/html/wp-content
sudo chmod 755 /var/www/html/wp-content
sudo chown -R www-data:www-data /var/www/html/wp-content
ls -lh /var/www/html/wp-content

printf "\nReady for update!\n"
