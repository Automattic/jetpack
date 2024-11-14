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

echo SUBSCRIBER_USER_ID is ${SUBSCRIBER_USER_ID};
echo SUBSCRIBER_RESTAPI_NONCE is ${SUBSCRIBER_RESTAPI_NONCE};
echo SUBSCRIBER_AUTH_COOKIE is ${SUBSCRIBER_AUTH_COOKIE};

NODE_ENV="AUTH_COOKIE_NAME=${AUTH_COOKIE_NAME} \
  SUBSCRIBER_AUTH_COOKIE='${SUBSCRIBER_AUTH_COOKIE}' \
  SUBSCRIBER_USER_ID=${SUBSCRIBER_USER_ID} \
  SUBSCRIBER_RESTAPI_NONCE=${SUBSCRIBER_RESTAPI_NONCE} \
";
echo NODE_ENV is ${NODE_ENV};

echo "Running e2e tests";
if [ "${WPCOMSH_DEVMODE}" = "1" ]; then
  su -l node -c "${NODE_ENV} npm --prefix /e2e run test:watch"
else
  su -l node -c "${NODE_ENV} npm --prefix /e2e run test";
fi
