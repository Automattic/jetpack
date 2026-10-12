#!/usr/bin/env bash
# Runs the suite against the env:local site, with Docker's default admin standing in for the encrypted config.
set -e
cd "$( dirname "${BASH_SOURCE[0]}" )/.."

export TEST_SITE=local
export NODE_CONFIG="{\"testSites\":{\"local\":{\"url\":\"http://localhost:${PORT_WORDPRESS:-8889}\",\"username\":\"jp_docker_acct\",\"password\":\"jp_docker_pass\"}}}"
exec pnpm run test:run "$@"
