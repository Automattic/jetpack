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

printf "\nDeactivating Jetpack and removing any related plugins\n"
wp plugin --allow-root deactivate jetpack || true
rm -rf /var/www/html/wp-content/plugins/jetpack || true
rm -rf /var/www/html/wp-content/plugins/boost || true
rm -rf /var/www/html/wp-content/plugins/beta || true
rm -rf /var/www/html/wp-content/plugins/debug-helper || true
rm -rf /var/www/html/wp-content/plugins/backup || true
rm -rf /var/www/html/wp-content/plugins/vaultpress || true

# Update FS permissions
sudo chmod 755 /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

ls -lh /var/www/html/wp-content/uploads
printf "\nDone with jetpack.zip preparation!\n"

printf "\nInstalling Jetpack stable\n"
wp plugin --allow-root install --activate jetpack

printf "\nCapture Jetpack status before update\n"
mkdir -p update-test-output
wp --allow-root jetpack status full > /var/www/html/wp-content/uploads/jetpack-status-before-update
cat /var/www/html/wp-content/uploads/jetpack-status-before-update

printf "\nSetting the update version and URL\n"
wp plugin --allow-root activate e2e-plugin-updater
wp --allow-root option set e2e_jetpack_upgrader_update_version 99.9-alpha
wp --allow-root option set e2e_jetpack_upgrader_plugin_url "${1}"/wp-content/uploads/jetpack.99.9.zip
ls /var/www/html/wp-content/uploads/
rm -rf /root/.wp-cli/cache/plugin/jetpack-99.9-alpha.zip

printf "\nReady for update!\n"
