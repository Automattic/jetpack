#!/bin/bash

# The docker container logs annoying errors if /var/log/php/xdebug_remote.log isn't writable.
if [[ ! -e /tmp/dummy-log/xdebug_remote.log ]]; then
	mkdir -p /tmp/dummy-log
	ln -s /dev/null /tmp/dummy-log/xdebug_remote.log
fi

docker pull --quiet ghcr.io/automattic/jetpack-wordpress-dev:latest

# Work around https://github.com/fabiospampinato/atomically/issues/13 by extracting /etc/passwd from the container and appending the entry for $EUID to it.
TMPFILE=$( mktemp )
function cleanup {
	rm -f "$TMPFILE"
}
trap cleanup exit
chmod 0644 "$TMPFILE"
docker run --rm ghcr.io/automattic/jetpack-wordpress-dev:latest cat /etc/passwd > "$TMPFILE"
getent passwd $EUID >> "$TMPFILE"

docker run --rm --workdir "$PWD" --user $EUID --volume "$TMPFILE":/etc/passwd --volume /tmp/:/tmp/ --volume /tmp/dummy-log:/var/log/php ghcr.io/automattic/jetpack-wordpress-dev:latest /tmp/monorepo/.github/files/renovate-post-upgrade.sh "$@"
