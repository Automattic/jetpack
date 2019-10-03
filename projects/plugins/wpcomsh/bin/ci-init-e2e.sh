#!/bin/sh

echo "Setting up test dir";
chown -R node:node /e2e;

echo "Installing system dependencies";
apt-get update; apt-get -y upgrade; apt-get -y install netcat;

echo "Installing node dependencies";
su -l node -c "npm --prefix /e2e ci";

echo "Waiting on nginx to be ready...";
sh /usr/local/bin/wait-for nginx:8989 -t 30 || exit 1;

echo "Waiting on WP php-fpm to be ready...";
sh /usr/local/bin/wait-for wp:9000 -t 30 || exit 1;

echo "Running e2e tests";
if [ "$DEVSPECS" = "1" ]; then
  su -l node -c "npm --prefix /e2e run test:watch"
else
  su -l node -c "npm --prefix /e2e run test";
fi
