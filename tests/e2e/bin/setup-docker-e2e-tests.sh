#!/bin/bash

# Exit if any command fails
set -e

# Set up environment variables
. "$(dirname "$0")/bootstrap-env.sh"

# Include useful functions
. "$(dirname "$0")/includes.sh"

if [ "${1}" == "reset" ]; then
	echo -e $(status_message "Resetting ngrok...")
	restart_tunnel

else
	echo -e $(status_message "Starting ngrok...")
	start_ngrok
fi


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
