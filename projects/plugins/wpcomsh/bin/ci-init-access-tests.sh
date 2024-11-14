#!/bin/sh

if [ "$1" = "private" ]; then
  echo Running Private Site Tests!
  PROJECT=wpcomsh_private_access
else
  echo Running Public Site Tests!
  PROJECT=wpcomsh_public_access
fi
NETWORK=$PROJECT
WPDATA=${PROJECT}_wpdata
ALLCONTAINERS='db jest nginx wp wpcli'
CHOKIDAR_PID=''

finish () {
  STATUS=$?;
  tidyupdocker;
  if [ "${CHOKIDAR_PID}" ]; then
    echo Stopping file watcher
    kill -9 "${CHOKIDAR_PID}" 2>/dev/null
  fi
  exit $STATUS;
}
trap "finish" HUP INT TERM QUIT

tidyupdocker () {
  echo Tidying up containers
  for C in $ALLCONTAINERS; do
    docker rm -f -v wpcomsh_public_access_$C >/dev/null 2>/dev/null
    docker rm -f -v wpcomsh_private_access_$C >/dev/null 2>/dev/null
  done

  echo Tidying up network
  docker network rm $NETWORK >/dev/null 2>/dev/null

  echo Tidying up shared volume
  docker volume rm -f $WPDATA >/dev/null
}

tidyupdocker

echo Creating network
docker network create $NETWORK

echo Creating wp data shared volume
docker volume create $WPDATA >/dev/null

DB=`docker create \
  --name ${PROJECT}_db \
  --network-alias db \
  --network $NETWORK \
  --restart always \
  --env MYSQL_ROOT_PASSWORD=jfdsaf9wjfaospfopdsafjsda \
  --env MYSQL_DATABASE=wordpress --env MYSQL_USER=wp \
  --env MYSQL_PASSWORD=iojdgoisajsoife83489398f8ds9a \
  mariadb:lts`

WP=`docker create \
  --name ${PROJECT}_wp \
  --network-alias wp \
  --network $NETWORK \
  --mount source=$WPDATA,target=/var/www/html \
  --restart always \
  --env WORDPRESS_DB_HOST=db \
  --env WORDPRESS_DB_USER=wp \
  --env WORDPRESS_DB_NAME=wordpress \
  --env WORDPRESS_DB_PASSWORD=iojdgoisajsoife83489398f8ds9a \
  --env WORDPRESS_TABLE_PREFIX=wp_ \
  --env WORDPRESS_DEBUG=1 \
  wordpress:6-fpm`

WPCLI=`docker create \
  --name ${PROJECT}_wpcli \
  --network-alias wpcli \
  --network $NETWORK \
  --mount source=$WPDATA,target=/var/www/html \
  --entrypoint tail \
  --env WORDPRESS_DB_HOST=db \
  --env WORDPRESS_DB_USER=wp \
  --env WORDPRESS_DB_NAME=wordpress \
  --env WORDPRESS_DB_PASSWORD=iojdgoisajsoife83489398f8ds9a \
  --env WORDPRESS_TABLE_PREFIX=wp_ \
  --env WORDPRESS_DEBUG=1 \
  wordpress:cli-2 \
  -f /dev/null` # arguments for entrypoint go after the image

NGINX=`docker create \
  --name ${PROJECT}_nginx \
  --network-alias nginx \
  --network $NETWORK \
  --restart always \
  --publish 8989:8989/tcp \
  --mount source=$WPDATA,target=/var/www/html \
  nginx:stable`

echo Copying wpcli utils
docker cp ./bin/wait-for $WPCLI:/usr/local/bin/wait-for
docker cp ./bin/ci-init-cli.sh $WPCLI:/usr/local/bin/ci-init-cli.sh

echo Copying nginx config
docker cp ./tests/e2e/config/nginx.conf $NGINX:/etc/nginx/conf.d/site.conf

echo starting DB
docker start $DB

echo starting WP
docker start $WP

echo starting WPCLI
docker start $WPCLI

echo Copying the built plugin to the shared volume
docker exec --user root $WPCLI mkdir -p /var/www/html/wp-content/mu-plugins
docker cp ./build/wpcomsh $WPCLI:/var/www/html/wp-content/mu-plugins/wpcomsh/

echo \"Fixing\" Permissions for WP-CLI
docker exec --user root $WPCLI chown -R www-data:www-data /var/www/html

if [ "$1" = "private" ]; then
  echo Setting the site to Private
  docker exec $WPCLI /bin/sh /usr/local/bin/ci-init-cli.sh private
else
  echo Setting the site to Public
  docker exec $WPCLI /bin/sh /usr/local/bin/ci-init-cli.sh
fi

echo starting NGINX
docker start $NGINX

# Getting credentials so the test client can make logged-in requests
# @TODO Get an admin credential and check for the specific option on wp-admin/options-reading.php & other varied access

SUBSCRIBER_USER_ID=`docker exec -it $WPCLI wp user create alice alice@example.com --role=subscriber --porcelain`;
echo "Got SUBSCRIBER_USER_ID from wpcli: ${SUBSCRIBER_USER_ID}" | cat -v;

# For some reason, the value returned has a `\r` a the end and it breaks the next call unless we trim it :-/
SUBSCRIBER_USER_ID=`echo $SUBSCRIBER_USER_ID | sed -E -e 's/^[^[:alnum:]]*//' -e 's/[^[:alnum:]]*$//'`;
echo "Trimmed SUBSCRIBER_USER_ID: ${SUBSCRIBER_USER_ID}" | cat -v;

SUBSCRIBER_USER_ID=`echo $SUBSCRIBER_USER_ID | grep -E "^[[:digit:]]+$"`;
echo "Scrubbed SUBSCRIBER_USER_ID: ${SUBSCRIBER_USER_ID}";

if [ -z "$SUBSCRIBER_USER_ID" ]; then
  echo "Could not create subscriber user. Result: ${SUBSCRIBER_USER_ID}";
  exit 1;
fi
echo SUBSCRIBER_USER_ID is ${SUBSCRIBER_USER_ID};

AUTH_COOKIE_NAME=`docker exec -it $WPCLI wp eval 'echo AUTH_COOKIE;'`
echo AUTH_COOKIE_NAME is ${AUTH_COOKIE_NAME};
SUBSCRIBER_AUTH_COOKIE=`docker exec -it $WPCLI wp eval --user="${SUBSCRIBER_USER_ID}" "echo wp_generate_auth_cookie( get_current_user_id(), strtotime( '+99 day' ) );"`
echo SUBSCRIBER_AUTH_COOKIE is ${SUBSCRIBER_AUTH_COOKIE};
SUBSCRIBER_RESTAPI_NONCE=`docker exec -it $WPCLI wp eval --user="${SUBSCRIBER_USER_ID}" "echo wp_create_nonce( 'wp_rest' );"`;
echo SUBSCRIBER_RESTAPI_NONCE is ${SUBSCRIBER_RESTAPI_NONCE};

echo \"Fixing\" Permissions for WP
docker exec --user root $WP chown -R www-data:www-data /var/www/html

JEST=`docker create \
  --name ${PROJECT}_jest \
  --network-alias jest \
  --network ${NETWORK} \
  --env AUTH_COOKIE_NAME=${AUTH_COOKIE_NAME} \
  --env WPCOMSH_DEVMODE=${WPCOMSH_DEVMODE} \
  --env SUBSCRIBER_RESTAPI_NONCE=${SUBSCRIBER_RESTAPI_NONCE} \
  --env SUBSCRIBER_AUTH_COOKIE=${SUBSCRIBER_AUTH_COOKIE} \
  --env SUBSCRIBER_USER_ID=${SUBSCRIBER_USER_ID} \
  --entrypoint tail \
  node:18-bullseye-slim \
  -f /dev/null` # arguments for entrypoint go after the image

echo Copying jest utils
docker cp ./bin/wait-for $JEST:/usr/local/bin/wait-for
docker cp ./bin/ci-init-e2e.sh $JEST:/usr/local/bin/ci-init-e2e.sh
TEMPDIR=`mktemp -d`
chmod 755 $TEMPDIR
mkdir -p $TEMPDIR/specs
cp ./package*.json $TEMPDIR/
cp ./tests/e2e/jest.config.js $TEMPDIR/
if [ "$1" = "private" ]; then
  echo Copying Private Site test suite
  SPEC=./tests/e2e/specs/private-site-access.test.js
else
  echo Copying Public Site test suite
  SPEC=./tests/e2e/specs/public-site-access.test.js
fi
cp $SPEC $TEMPDIR/specs/
cp ./tests/e2e/specs/access-test-utils.js $TEMPDIR/specs/
cp ./tests/e2e/specs/access-test-utils.test.js $TEMPDIR/specs/
docker cp $TEMPDIR $JEST:/e2e
rm -rf $TEMPDIR

[ "${WPCOMSH_DEVMODE}" = "1" ] && \
  echo HELLO SPEC DEVELOPER!; \
  npx chokidar-cli \
    "$SPEC" \
    "./tests/e2e/specs/access-test-utils.js" \
    "./tests/e2e/specs/access-test-utils.test.js" \
    -c "docker cp {path} $JEST:/e2e/specs/" -d 800 & \
  CHOKIDAR_PID=$!

echo starting JEST
docker start $JEST
docker exec $JEST /bin/sh /usr/local/bin/ci-init-e2e.sh
finish
