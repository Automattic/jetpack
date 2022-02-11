#!/bin/bash
# Exit if any command fails.
set -e

##
# This script creates a jetpack .zip that is accessible externally via site/wp-content/jetpack.zip

# Parameters
WORKING_DIR="/usr/local/src/jetpack-monorepo/projects/plugins/jetpack"
ZIP_FILE="/var/www/html/wp-content/uploads/jetpack.99.9.zip"
TMP_DIR="/tmp/jetpack"

# Deactivate and remove linked Jetpack plugin from monorepo
wp plugin --allow-root deactivate jetpack || true # prevent exiting the script if jetpack is not installed
rm /var/www/html/wp-content/plugins/jetpack || true
rm /var/www/html/wp-content/plugins/boost || true
rm /var/www/html/wp-content/plugins/beta || true
rm /var/www/html/wp-content/plugins/debug-helper || true
rm /var/www/html/wp-content/plugins/backup || true
rm /var/www/html/wp-content/plugins/vaultpress || true

# Prepare jetpack.zip
rm -rf $TMP_DIR $ZIP_FILE
mkdir -p $TMP_DIR

echo "Copy build files"
FILES=$(ls -Ad $WORKING_DIR/* | grep -Ev "node_modules|packages|tests|_inc/client|docker|docs|extensions|.git")
cp -r $FILES $TMP_DIR

if $(! which "zip" > /dev/null 2>&1); then
		apt update > /dev/null
		apt install zip -y > /dev/null
fi

echo "Create archive"
cd /tmp
zip -qr $ZIP_FILE jetpack
rm -rf $TMP_DIR
cd /var/www/html/

# Update FS permissions
sudo chmod 755 /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

echo "Done with jetpack.zip preparation!"
