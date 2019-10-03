#!/bin/sh
DEVSPECS=0; # Set this to 1 to enable "hot-reloading" spec development

if [ "$1" = "private" ]; then
  echo Running Private Site Tests!
  PROJECT=wpcomsh_private_access
else
  echo Running Public Site Tests!
  PROJECT=wpcomsh_public_access
fi
NETWORK=$PROJECT
WPDATA="$PROJECT"_wpdata
ALLCONTAINERS='db jest nginx wp wpcli'

tidyupdocker () {
  echo Tidying up any stray containers
  for C in $ALLCONTAINERS; do
    docker rm -f "$PROJECT"_"$C" >/dev/null 2>/dev/null
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
  --name "$PROJECT"_db \
  --network-alias db \
  --network $NETWORK \
  --restart always \
  --env MYSQL_ROOT_PASSWORD=jfdsaf9wjfaospfopdsafjsda \
  --env MYSQL_DATABASE=wordpress --env MYSQL_USER=wp \
  --env MYSQL_PASSWORD=iojdgoisajsoife83489398f8ds9a \
  mysql:5.7`

WP=`docker create \
  --name "$PROJECT"_wp \
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
  wordpress:5.2-php7.3-fpm`

WPCLI=`docker create \
  --name "$PROJECT"_wpcli \
  --network-alias wpcli \
  --network $NETWORK \
  --mount source=$WPDATA,target=/var/www/html \
  --entrypoint tail \
  wordpress:cli-2.3-php7.3 \
  -f /dev/null` # arguments for entrypoint go after the image

NGINX=`docker create \
  --name "$PROJECT"_nginx \
  --network-alias nginx \
  --network $NETWORK \
  --restart always \
  --publish 8989:8989/tcp \
  --mount source=$WPDATA,target=/var/www/html \
  nginx:1.16.1`

JEST=`docker create \
  --name "$PROJECT"_jest \
  --network-alias jest \
  --network $NETWORK \
  --env DEVSPECS=$DEVSPECS \
  --entrypoint tail \
  node:10.16.3-stretch-slim \
  -f /dev/null` # arguments for entrypoint go after the image

echo Copying wpcli utils
docker cp ./bin/wait-for $WPCLI:/usr/local/bin/wait-for
docker cp ./bin/ci-init-cli.sh $WPCLI:/usr/local/bin/ci-init-cli.sh

echo Copying nginx config
docker cp ./tests/e2e/config/nginx.conf $NGINX:/etc/nginx/conf.d/site.conf

echo Copying jest utils
docker cp ./bin/wait-for $JEST:/usr/local/bin/wait-for
docker cp ./bin/ci-init-e2e.sh $JEST:/usr/local/bin/ci-init-e2e.sh
TEMPDIR=`mktemp -d`
chmod 755 $TEMPDIR
cp ./package*.json $TEMPDIR/
cp ./tests/e2e/jest.config.js $TEMPDIR/
if [ "$1" = "private" ]; then
  echo Copying Private Site test specs
  SPECDIR=./tests/e2e/specs/private-site
else
  echo Copying Public Site test specs
  SPECDIR=./tests/e2e/specs/public-site
fi
cp -a $SPECDIR $TEMPDIR/specs
docker cp $TEMPDIR $JEST:/e2e
rm -rf $TEMPDIR

echo starting DB
docker start $DB

echo starting WP
docker start $WP

echo starting WPCLI
docker start $WPCLI

echo Copying the built plugin to a temp directory
TEMPDIR=`mktemp -d`
chmod 755 $TEMPDIR
cp -a ./build/wpcomsh/* $TEMPDIR/
echo Removing the mu-plugin "loader" file from the copy of the built plugin
rm $TEMPDIR/wpcomsh-loader.php
echo Copying the built plugin to the shared volume
docker cp $TEMPDIR $WPCLI:/var/www/html/wp-content/plugins/wpcomsh/
rm -rf $TEMPDIR

if [ "$1" = "private" ]; then
  echo Kicking off Private Site tests
  docker exec $WPCLI /bin/sh /usr/local/bin/ci-init-cli.sh private
else
  echo Kicking off Public Site tests
  docker exec $WPCLI /bin/sh /usr/local/bin/ci-init-cli.sh
fi

echo starting NGINX
docker start $NGINX

[ "$DEVSPECS" = "1" ] && \
  echo HELLO SPEC DEVELOPER!; \
  npx chokidar-cli "$SPECDIR/*.js" -c "echo detected change at {path}; docker cp {path} $JEST:/e2e/specs/" -d 800 &

echo starting JEST
docker start $JEST
docker exec $JEST /bin/sh /usr/local/bin/ci-init-e2e.sh

STATUS=$?

# Comment out the following line if you'd like to leave the containers running to test, etc.
tidyupdocker

exit $STATUS
