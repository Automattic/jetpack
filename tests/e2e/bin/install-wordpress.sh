#!/bin/bash

# Exit if any command fails.
set -e

# Gutenberg script includes.
. "$(dirname "$0")/includes.sh"

# Set up environment variables
. "$(dirname "$0")/bootstrap-env.sh"

# These are the containers and values for the development site.
CLI="cli_e2e_tests"
CONTAINER='wordpress_e2e_tests'
SITE_TITLE='E2E Testing'

# Get the host port for the WordPress container.
HOST_PORT=$(docker-compose $DOCKER_COMPOSE_FILE_OPTIONS port $CONTAINER 80 | awk -F : '{printf $2}')

# Wait until the Docker containers are running and the WordPress site is
# responding to requests.
echo -en $(status_message "Attempting to connect to WordPress...")
until $(curl -L http://localhost:$HOST_PORT -so - 2>&1 | grep -q "WordPress"); do
    echo -n '.'
    sleep 5
done
echo ''

# Reset the database so no posts/comments/etc.
echo -e $(status_message "Resetting test database...")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI db reset --yes --quiet

# Install WordPress.
echo -e $(status_message "Installing WordPress...")
# The `-u 33` flag tells Docker to run the command as a particular user and
# prevents permissions errors. See: https://github.com/WordPress/gutenberg/pull/8427#issuecomment-410232369
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI core install --title="$SITE_TITLE" --admin_user=wordpress --admin_password=wordpress --admin_email=test@example.com --skip-email --url=http://localhost:$HOST_PORT --quiet

# CURRENT_WP_VERSION=$(docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run -T --rm $CLI core version)
# echo -e $(status_message "Current WordPress version: $CURRENT_WP_VERSION...")

# if [ "$WP_VERSION" == "latest" ]; then
# 	# Check for WordPress updates, to make sure we're running the very latest version.
# 	echo -e $(status_message "Updating WordPress to the latest version...")
# 	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI core update --quiet
# 	echo -e $(status_message "Updating The WordPress Database...")
# 	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI core update-db --quiet
# fi

# Install a dummy favicon to avoid 404 errors.
echo -e $(status_message "Installing a dummy favicon...")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm $CONTAINER touch /var/www/html/favicon.ico

echo -e $(status_message "Setting up dynamic WP_HOME & SITE_URL...")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI config set WP_SITEURL "'http://' . \$_SERVER['HTTP_HOST']" --raw --type=constant --quiet

docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI config set WP_HOME "'http://' . \$_SERVER['HTTP_HOST']" --raw --type=constant --quiet

# If the 'wordpress' volume wasn't during the down/up earlier, but the post port has changed, we need to update it.
# echo -e $(status_message "Checking the site's url...")
# CURRENT_URL=$(docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run -T --rm $CLI option get siteurl)
# if [ "$CURRENT_URL" != "http://localhost:$HOST_PORT" ]; then
# 	$DC run --rm -u 33 $CLI option update home http://localhost:$HOST_PORT
# 	$DC run --rm -u 33 $CLI option update siteurl http://localhost:$HOST_PORT
# fi

# Configure site constants.
echo -e $(status_message "Configuring site constants...")
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI config set WP_DEBUG true --raw --type=constant --quiet
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI config set WP_DEBUG_LOG true --raw --type=constant --quiet
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI config set WP_DEBUG_DISPLAY false --raw --type=constant --quiet
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI config set JETPACK_BETA_BLOCKS true --raw --type=constant --quiet

docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm $CONTAINER touch /var/www/html/wp-content/debug.log

# NOTE: Force classic connection flow
# https://github.com/Automattic/jetpack/pull/13288
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI config set JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME true --raw --type=constant --quiet


echo -e $(status_message "Activating Jetpack and test plugins..")
docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI plugin activate jetpack --quiet

docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm $CONTAINER cp wp-content/plugins/jetpack/tests/e2e/plugins/e2e-plan-data-interceptor.php wp-content/plugins/e2e-plan-data-interceptor.php

docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm -u 33 $CLI plugin activate e2e-plan-data-interceptor.php --quiet
