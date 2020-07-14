#!/bin/bash

# Exit if any command fails.
set -e

WP_CORE_DIR="/var/www/html"
WORKING_DIR="/var/www/html/wp-content/jetpack"
JP_DIR="wp-content/plugins/jetpack"

rm -rf $JP_DIR
mkdir -p $JP_DIR

FILES=$(ls -Ad $WORKING_DIR/* | grep -Ev "node_modules|docker|docs|extensions|.git")
cp -r $FILES $JP_DIR


echo "Zipping jetpack bundle"

apt update
apt install zip -y

find $JP_DIR -type d -print0 | xargs -0 chmod 755
find $JP_DIR -type f -print0 | xargs -0 chmod 644
chown www-data:www-data -R $JP_DIR

cd /var/www/html/wp-content/plugins

zip -qr ../jetpack-dev.zip jetpack

cd ..

chown www-data:www-data -R jetpack-dev.zip
chmod 777 -R jetpack-dev.zip

echo "Done!"

# Symlink Jetpack into plugins directory
# ln -s $WORKING_DIR $WP_CORE_DIR/wp-content/plugins/
