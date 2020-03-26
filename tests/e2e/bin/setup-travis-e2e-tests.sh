#!/bin/bash

# Exit if any command fails
set -e

# Set up environment variables
. "$(dirname "$0")/bootstrap-env.sh"

# Include useful functions
. "$(dirname "$0")/includes.sh"


echo -e $(status_message "Starting ngrok...")
start_ngrok

# Download image updates.
echo -e $(status_message "Downloading Docker image updates...")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS pull mysql wordpress_e2e_tests cli_e2e_tests


# Launch the containers.
echo -e $(status_message "Starting Docker containers...")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS up -d --remove-orphans mysql wordpress_e2e_tests cli_e2e_tests >/dev/null

# Set up WordPress Development site.
. "$(dirname "$0")/install-wordpress.sh" --e2e_tests


echo -e $(status_message "Activating Jetpack...")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI plugin activate jetpack

echo
status_message "Open ${WP_SITE_URL} to see your site!"
echo
