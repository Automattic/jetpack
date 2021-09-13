#!/bin/bash

# Automatically upgrade the MySQL/MariaDB databases when starting the container
# This is required on every major database version bump.
# The script will wait until we can connect to the database server in the main container,
# run the upgrade command and then exit.

CREDENTIALS_PARAMS="-uroot -p${MYSQL_ROOT_PASSWORD} -hdb"

# Wait until server is up
while ! mysql $CREDENTIALS_PARAMS ${MYSQL_DATABASE} -e "SELECT 1 FROM wp_posts LIMIT 1" > /dev/null 2>&1
do
	# Let's wait a bit before retrying
	echo "Waiting for DB to be up..."
	sleep 1
done

echo "Server is running, trying to upgrade database..."

mysql_upgrade $CREDENTIALS_PARAMS
