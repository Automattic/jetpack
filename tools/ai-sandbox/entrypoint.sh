#!/bin/bash
if [ "$(stat -c '%U:%G' /home/dev/jetpack/node_modules)" != "dev:dev" ]; then
	chown -R dev:dev /home/dev/jetpack/node_modules
fi
# Align container group GID with the host docker.sock GID so 'dev' can access the socket.
# If another group already owns that GID, add dev to that group instead of fighting over it.
if [ -S /var/run/docker.sock ]; then
	SOCKET_GID=$(stat -c '%g' /var/run/docker.sock)
	EXISTING_GROUP=$(getent group "$SOCKET_GID" | cut -d: -f1)
	if [ -n "$EXISTING_GROUP" ]; then
		usermod -aG "$EXISTING_GROUP" dev
	else
		groupmod -g "$SOCKET_GID" docker
		usermod -aG docker dev
	fi
fi
exec gosu dev "$@"
