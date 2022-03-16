#!/bin/bash

docker pull --quiet ghcr.io/automattic/jetpack-wordpress-dev:latest
docker run --rm --workdir "$PWD" --user $EUID --volume /tmp/:/tmp/ ghcr.io/automattic/jetpack-wordpress-dev:latest /tmp/monorepo/.github/files/renovate-post-upgrade.sh "$@"
