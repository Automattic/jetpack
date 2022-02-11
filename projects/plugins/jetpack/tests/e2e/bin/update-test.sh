#!/bin/bash
# Exit if any command fails.
set -e

# This is a complete Jetpack plugin update flow through the CLI
# It creates a new version archive and updates the stable version to it
# =====================================================================

if [ -z "${1}" ]; then
	echo "ERROR: Missing argument site url"
	echo "usage: $0 URL"
	exit 1
fi

printf "\nChecking (and installing) zip package\n"
which zip || apt-get update && apt-get install -y zip

PLUGINS_DIR="/usr/local/src/jetpack-monorepo/projects/plugins"
ZIP_FILE="/var/www/html/wp-content/uploads/jetpack.99.9.zip"

printf "\nDeactivating Jetpack and removing any related plugins\n"
wp plugin --allow-root deactivate jetpack || true
rm -rf /var/www/html/wp-content/plugins/jetpack || true
rm -rf /var/www/html/wp-content/plugins/boost || true
rm -rf /var/www/html/wp-content/plugins/beta || true
rm -rf /var/www/html/wp-content/plugins/debug-helper || true
rm -rf /var/www/html/wp-content/plugins/backup || true
rm -rf /var/www/html/wp-content/plugins/vaultpress || true

printf "\nPreparing zip file\n"
cd "$PLUGINS_DIR"
find -L jetpack ! -path '**/node_modules/*' ! -path '**/\.cache/*' ! -path '**/tests/*' ! -path '**/changelog/*' ! -path '**/wordpress/*' ! -path '**/\.idea/*' -print | zip "$ZIP_FILE" -@


# Update FS permissions
sudo chmod 755 /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

ls -lh /var/www/html/wp-content/uploads
printf "\nDone with jetpack.zip preparation!\n"

printf "\nInstalling Jetpack stable\n"
wp plugin --allow-root install --activate jetpack

printf "\nGet Jetpack status before update\n"
mkdir -p update-test-output
wp --allow-root jetpack status full > update-test-output/jetpack-status-before-update
cat update-test-output/jetpack-status-before-update

printf "\nSetting update version and URL\n"
wp plugin --allow-root activate e2e-plugin-updater
wp --allow-root option set e2e_jetpack_upgrader_update_version 99.9-alpha
wp --allow-root option set e2e_jetpack_upgrader_plugin_url "${1}"/wp-content/uploads/jetpack.99.9.zip
ls /var/www/html/wp-content/uploads/
rm -rf /root/.wp-cli/cache/plugin/jetpack-99.9-alpha.zip

printf "\nAttempting update\n"
wp plugin --allow-root update jetpack

printf "\nGet Jetpack status after update\n"
wp --allow-root jetpack status full > update-test-output/jetpack-status-after-update
cat update-test-output/jetpack-status-after-update

printf "\nCapture Jetpack status diff\n"
diff -y --suppress-common-lines update-test-output/jetpack-status-before-update update-test-output/jetpack-status-after-update > update-test-output/diff
cat update-test-output/diff
