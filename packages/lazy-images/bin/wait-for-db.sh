#!/usr/bin/env bash
# Use this script to test if a the mysql server is ready.
# Note, if you change the root user password in the docker-compose.yml file, it will need to be updated here too.

end=$((SECONDS+60))
while ! docker-compose exec -T db mysqladmin --user=root --password=root --host "127.0.0.1" ping --silent &> /dev/null ; do
    echo "Waiting for database connection..."
    if [ $end -lt $SECONDS ]; then
        exit 1
    fi
    sleep 2
done
