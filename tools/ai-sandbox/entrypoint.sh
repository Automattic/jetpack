#!/bin/bash
if [ "$(stat -c '%U:%G' /home/dev/jetpack/node_modules)" != "dev:dev" ]; then
	chown -R dev:dev /home/dev/jetpack/node_modules
fi
exec gosu dev "$@"
