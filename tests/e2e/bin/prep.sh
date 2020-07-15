#!/bin/bash
# Exit if any command fails.
set -e

WP_CORE_DIR="/var/www/html"
WORKING_DIR="/var/www/html/wp-content/jetpack-dev"
JP_DIR="wp-content/jetpack"

rm -rf $JP_DIR $JP_DIR.zip wp-content/plugins/jetpack/
# removing symlink
rm wp-content/plugins/jetpack-dev || true
mkdir -p $JP_DIR

FILES=$(ls -Ad $WORKING_DIR/* | grep -Ev "node_modules|docker|docs|extensions|.git")
cp -r $FILES $JP_DIR

echo "Zipping jetpack bundle"

apt update > /dev/null
apt install zip -y > /dev/null

cd /var/www/html/wp-content

zip -qr jetpack.zip jetpack/
rm -rf jetpack/

echo "Done!"

# Symlink Jetpack into plugins directory
ln -s $WORKING_DIR $WP_CORE_DIR/wp-content/plugins/
