#!/usr/bin/env bash

WP_VERSION=${WP_VERSION-latest}
WP_DEBUG=${WP_DEBUG-true}
SCRIPT_DEBUG=${SCRIPT_DEBUG-true}
DOCKER=${DOCKER-false}
DOCKER_ENV=${DOCKER_ENV-ci}
WP_SITE_URL=${WP_SITE_URL-localhost}
DOCKER_COMPOSE_FILE_OPTIONS="-f $(dirname "$0")/docker-compose.yml"

DC="docker-compose $DOCKER_COMPOSE_FILE_OPTIONS"
