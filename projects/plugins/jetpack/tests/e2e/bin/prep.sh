#!/bin/bash
# Exit if any command fails.
set -e

##
# This script creates a jetpack .zip that is accessible externaly via site/wp-content/jetpack.zip
# Also it creates a symlink from Jetpack directory to the wp-content/plugins

# Parameters
WP_CORE_DIR="/var/www/html"
WORKING_DIR="$WP_CORE_DIR/wp-content/plugins/jetpack"
ZIP_FILE="$WP_CORE_DIR/wp-content/uploads/jetpack.zip"
TMP_DIR="/tmp/jetpack"



# if [[ -L "$WORKING_DIR" && -d "$WORKING_DIR" ]]
# then
#     echo "Jetpack is a symlink to a directory"
# elif [[ -d $WORKING_DIR ]]
# then
#     echo "Jetpack is a directory"
# 		rm -rf /var/www/html/wp-content/plugins/jetpack
# 		ln -s /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/ /var/www/html/wp-content/plugins/jetpack
# else
#     echo "The file ${FILE} does not exist!"
# fi

if [[ -L "$WORKING_DIR" && -d "$WORKING_DIR" ]]
then
	echo "Jetpack is a symlink already"
else
	rm -rf /var/www/html/wp-content/plugins/jetpack
	ln -s /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/ /var/www/html/wp-content/plugins/jetpack
fi

########

rm -rf $TMP_DIR $ZIP_FILE
mkdir -p $TMP_DIR

FILES=$(ls -Ad $WORKING_DIR/* | grep -Ev "node_modules|packages|tests|_inc/client|docker|docs|extensions|.git")
cp -r $FILES $TMP_DIR

if $(! type -t "zip" > /dev/null 2>&1); then
		apt update > /dev/null
		apt install zip -y > /dev/null
fi

cd $(dirname "$TMP_DIR")
echo "1"

zip -qr $ZIP_FILE jetpack/
rm -rf $TMP_DIR
echo "1"

echo "Done with jetpack.zip preparation!"
