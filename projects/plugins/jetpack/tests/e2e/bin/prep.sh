#!/bin/bash
# Exit if any command fails.
set -e

##
# This script creates a jetpack .zip that is accessible externaly via site/wp-content/jetpack.zip
# Also it creates a symlink from Jetpack directory to the wp-content/plugins

# Parameters
WORKING_DIR="/usr/local/src/jetpack-monorepo/projects/plugins/jetpack/"
ZIP_FILE="/var/www/html/wp-content/uploads/jetpack.zip"
TMP_DIR="/tmp/jetpack"


# Deactive and remove linked Jetpack plugin from monorepo

wp plugin --allow-root deactivate jetpack || true # prevent exiting the script if jetpack is not installed
rm /var/www/html/wp-content/plugins/jetpack || true

# Prepare jetpack.zip

rm -rf $TMP_DIR $ZIP_FILE
mkdir -p $TMP_DIR

FILES=$(ls -Ad $WORKING_DIR/* | grep -Ev "node_modules|packages|tests|_inc/client|docker|docs|extensions|.git")
cp -r $FILES $TMP_DIR

if $(! type -t "zip" > /dev/null 2>&1); then
		apt update > /dev/null
		apt install zip -y > /dev/null
fi

# cd $(dirname "$TMP_DIR")

zip -qr $ZIP_FILE /tmp/jetpack/
rm -rf $TMP_DIR
chmod 755 $ZIP_FILE

# Install latest stable Jetpack from plugin repo

wp plugin --allow-root install --activate jetpack
wp plugin --allow-root activate e2e-plugin-updater

wp option --allow-root set e2e_jetpack_upgrader_update_version 99.9-alpha

# Update FS permissions

chown -R www-data:www-data /var/www/html/wp-content/
chown -R www-data:www-data /var/www/html/wp-content/plugins/
chmod -R 775 /var/www/html/wp-content

# chown -R www-data:www-data /var/www
# chmod -R 755 /var/www/html/wp-content

echo "Done with jetpack.zip preparation!"
