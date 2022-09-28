#!/bin/bash

##
##  The WordPress base image installs WordPress, then launches apache directly.
##  See: https://github.com/docker-library/wordpress/blob/b9af6087524edc719249f590940b34ef107c95ca/latest/php7.4/apache/docker-entrypoint.sh
##
##  This wrapper hijacks that part of the process, and sets up WordPress too.
##

wp core install \
	--allow-root \
	--url="http://localhost:$SUPER_CACHE_E2E_PORT" \
	--path=/var/www/html \
	--title='Super Cache e2e' \
	--admin_user="$SUPER_CACHE_E2E_ADMIN_USER" \
	--admin_password="$SUPER_CACHE_E2E_ADMIN_PASSWORD" \
	--admin_email=fake@example.com

wp rewrite structure '/%year%/%monthnum%/%postname%/'\
	--allow-root \
	--path=/var/www/html

# Start Apache.
apache2-foreground
