#!/bin/bash

cd /var/www/html

if ! $(wp core is-installed); then
	echo "WordPress has to be installed first. To install, run:"
	echo "  yarn docker:install"
	exit 1;
fi

# Install WordPress Importer
# https://wordpress.org/plugins/wordpress-importer/
wp plugin install wordpress-importer --activate

IMPORT_FILE=/var/www/html/wp-content/wptest.xml

if [ ! -f $IMPORT_FILE ]
then
	curl --location --output $IMPORT_FILE \
		https://raw.githubusercontent.com/poststatus/wptest/master/wptest.xml
fi

wp import $IMPORT_FILE --authors=create
