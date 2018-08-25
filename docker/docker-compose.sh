#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

function set_port {
	SERVICE="$1"
	PORT="$2"
	if [ -z "$PORT" ]; then
		cat
	fi

	perl -p -e 's/"\d+:(\d+)"\s+#port:'"$SERVICE"'/"'"$PORT"':$1" #taken from PORT_'"$SERVICE"'/' -
}

cat "$DIR"/docker-compose.yml \
	| set_port MYSQL "$PORT_MYSQL" \
	| set_port MAILDEV "$PORT_MAILDEV" \
	| set_port SMTP "$PORT_SMTP" \
	| set_port SFTP "$PORT_SFTP" \
	| set_port WORDPRESS "$PORT_WORDPRESS"
