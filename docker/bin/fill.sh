#!/bin/bash

echo "👇"
echo "WP_DOMAIN:  ${WP_DOMAIN}"
echo "WP_ADMIN_USER:  ${WP_ADMIN_USER}"
echo "WP_ADMIN_EMAIL:  ${WP_ADMIN_EMAIL}"
echo "WP_ADMIN_PASSWORD:  ${WP_ADMIN_PASSWORD}"
echo "WP_TITLE:  ${WP_TITLE}"
echo "WP_DB_NAME:  ${WP_DB_NAME}"
echo "WP_DB_USER:  ${WP_DB_USER}"
echo "WP_DB_PASSWORD:  ${WP_DB_PASSWORD}"
echo "WP_SFTP_USER:  ${WP_SFTP_USER}"
echo "WP_SFTP_PASSWORD:  ${WP_SFTP_PASSWORD}"

exit 0;

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
