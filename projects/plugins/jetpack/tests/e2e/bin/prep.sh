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

rm -rf $TMP_DIR $ZIP_FILE
mkdir -p $TMP_DIR

FILES=$(ls -Ad $WORKING_DIR/* | grep -Ev "node_modules|packages|tests|_inc/client|docker|docs|extensions|.git")
cp -r $FILES $TMP_DIR

if $(! type -t "zip" > /dev/null 2>&1); then
		apt update > /dev/null
		apt install zip -y > /dev/null
fi

cd $(dirname "$TMP_DIR")

zip -qr $ZIP_FILE jetpack/
rm -rf $TMP_DIR
chmod 755 $ZIP_FILE

sudo chown -R www-data:www-data /var/www/html/wp-content/
sudo chown -R www-data:www-data /var/www/html/wp-content/plugins/
sudo chmod -R 775 /var/www/html/wp-content

ls -la /var/www/html
echo "111"
ls -la /var/www/html/wp-content/
echo "111"
ls -la /var/www/html/wp-content/plugins
echo "111"
wp plugin --allow-root list

echo "QQQQQ"

head -20 /var/www/html/wp-content/plugins/jetpack/jetpack.php
echo "QQQQQ"

head -20 $WORKING_DIR/jetpack.php

echo "Done with jetpack.zip preparation!"
