#!/bin/bash

# This file is run in two cases:
# 1. The container is being built, so it's included into the `docker/bin/run.sh`
# 2. Using the command `jetpack docker run-extras` when something was added to the initialization process,
#    but you don't want to rebuild the whole container.
#
# Considering the above, the file should not contain any initialization-only code so it could be run inside an already running container.
# On the other hand, the file should also always be tested on newly initialized containers so it would also work when loaded into `docker/bin/run.sh`.

echo "[clientdocker]
user=\"${MYSQL_USER}\"
password=\"${MYSQL_PASSWORD}\"
host=db
database=\"${MYSQL_DATABASE}\"" > ~/.my.cnf
