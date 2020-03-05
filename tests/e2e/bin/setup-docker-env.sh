#!/bin/bash

# Download image updates.
echo -e $(status_message "Downloading Docker image updates...")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS pull mysql wordpress_e2e_tests cli_e2e_tests


# Launch the containers.
echo -e $(status_message "Starting Docker containers...")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS up -d --remove-orphans --force-recreate mysql wordpress_e2e_tests cli_e2e_tests >/dev/null

# Set up WordPress Development site.
. "$(dirname "$0")/install-wordpress.sh"

echo
status_message "Open ${WP_SITE_URL} to see your site!"
echo
