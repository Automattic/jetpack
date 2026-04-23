#!/bin/bash
chown -R dev:dev /home/dev/jetpack/node_modules
exec gosu dev "$@"
