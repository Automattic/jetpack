#!/bin/bash

# The standard image does not chown the log directory.
find /var/log/mysql \! -user mysql -exec chown mysql '{}' +

# Automatically upgrade the MySQL/MariaDB databases when starting the container
# This is required on every major database version bump.
# The script will wait until we can connect to the database server in the main container,
# run the upgrade command and then exit.
(
	CREDENTIALS_PARAMS="-uroot -p${MYSQL_ROOT_PASSWORD} -hdb"

	sleep 1

	# Wait until server is up
	while ! mysql $CREDENTIALS_PARAMS ${MYSQL_DATABASE} -e 'quit' > /dev/null 2>&1
	do
		# Let's wait a bit before retrying
		echo "Auto-updater waiting for DB to be up..."
		sleep 1
	done

	echo "Trying to upgrade database..."

	mysql_upgrade $CREDENTIALS_PARAMS
) &

# Start the actual database
exec /usr/local/bin/docker-entrypoint.sh "$@"
