#!/bin/bash

if ! $(wp --allow-root core is-installed); then
	echo
	echo "WordPress has to be installed first. To install, run:"
	echo
	echo "  yarn docker:install"
	echo
	exit 1;
fi

# Install WordPress Importer
# https://wordpress.org/plugins/wordpress-importer/
wp --allow-root plugin install wordpress-importer --activate

IMPORT_FILE=/var/www/html/wp-content/wptest.xml

if [ ! -f $IMPORT_FILE ]
then
	curl --location --output $IMPORT_FILE \
		https://raw.githubusercontent.com/poststatus/wptest/master/wptest.xml
fi

wp --allow-root import $IMPORT_FILE --authors=create
