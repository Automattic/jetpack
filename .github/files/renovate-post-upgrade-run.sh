#!/bin/bash

# The docker container logs annoying errors if /var/log/php/xdebug_remote.log isn't writable.
if [[ ! -e /tmp/dummy-log/xdebug_remote.log ]]; then
	mkdir -p /tmp/dummy-log
	ln -s /dev/null /tmp/dummy-log/xdebug_remote.log
fi

docker pull --quiet ghcr.io/automattic/jetpack-wordpress-dev:latest
docker run --rm --workdir "$PWD" --user $EUID --volume /tmp/:/tmp/ --volume /tmp/dummy-log:/var/log/php ghcr.io/automattic/jetpack-wordpress-dev:latest /tmp/monorepo/.github/files/renovate-post-upgrade.sh "$@"
