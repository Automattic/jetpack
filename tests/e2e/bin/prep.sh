#!/bin/bash
# Exit if any command fails.
set -ex

##
# This script creates a jetpack .zip that is accessible externaly via site/wp-content/jetpack.zip
# Also it creates a symlink from Jetpack directory to the wp-content/plugins

# Parameters
WP_CORE_DIR=${1-"/var/www/html"}
WORKING_DIR=${2-"$WP_CORE_DIR/wp-content/jetpack-dev"}

ZIP_FILE="$WP_CORE_DIR/wp-content/jetpack.zip"
JP_DIR="/tmp/jetpack"

rm -rf $JP_DIR $ZIP_FILE wp-content/plugins/jetpack/
# removing symlink
rm wp-content/plugins/jetpack-dev || true
mkdir -p $JP_DIR

FILES=$(ls -Ad $WORKING_DIR/* | grep -Ev "node_modules|docker|docs|extensions|.git")
cp -r $FILES $JP_DIR

# /dev/null 2>&1
APT_UPDATE="apt update"
APT_INSTALL_ZIP="apt install zip -y"

if $(type -t "sudo" > /dev/null 2>&1); then
		APT_UPDATE="sudo $APT_UPDATE"
		APT_INSTALL_ZIP="sudo $APT_INSTALL_ZIP"
fi

eval $APT_UPDATE > /dev/null 2>&1
eval $APT_INSTALL_ZIP > /dev/null 2>&1


cd $(dirname "$JP_DIR")

zip -qr $ZIP_FILE jetpack/
rm -rf $JP_DIR

# Symlink Jetpack into plugins directory
ln -s $WORKING_DIR $WP_CORE_DIR/wp-content/plugins/jetpack-dev

echo "Done with jetpack.zip preparation!"
