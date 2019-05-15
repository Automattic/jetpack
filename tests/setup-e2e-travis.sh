#!/usr/bin/env bash
# see https://github.com/wp-cli/wp-cli/blob/master/templates/install-wp-tests.sh

set -ex

if [ $# -lt 3 ]; then
	echo "usage: $0 <db-name> <db-user> <db-pass> [db-host] [wp-version]"
	exit 1
fi

DB_NAME=$1
DB_USER=$2
DB_PASS=$3
DB_HOST=${4-localhost}
WP_VERSION=${5-latest}

WP_TESTS_DIR=${WP_TESTS_DIR-/tmp/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR-/tmp/wordpress/}

download() {
	if [ `which curl` ]; then
		curl -s "$1" > "$2";
	elif [ `which wget` ]; then
		wget -nv -O "$2" "$1"
	fi
}

install_wp() {
	if [ -d $WP_CORE_DIR ]; then
		return;
	fi

	mkdir -p $WP_CORE_DIR

	if [ $WP_VERSION == 'latest' ]; then
		local ARCHIVE_NAME='latest'
	else
		local ARCHIVE_NAME="wordpress-$WP_VERSION"
	fi

	download https://wordpress.org/${ARCHIVE_NAME}.tar.gz  /tmp/wordpress.tar.gz
	tar --strip-components=1 -zxmf /tmp/wordpress.tar.gz -C $WP_CORE_DIR

	download https://raw.github.com/markoheijnen/wp-mysqli/master/db.php $WP_CORE_DIR/wp-content/db.php
}

install_db() {
	# parse DB_HOST for port or socket references
	local PARTS=(${DB_HOST//\:/ })
	local DB_HOSTNAME=${PARTS[0]};
	local DB_SOCK_OR_PORT=${PARTS[1]};
	local EXTRA=""

	if ! [ -z $DB_HOSTNAME ] ; then
		if [ $(echo $DB_SOCK_OR_PORT | grep -e '^[0-9]\{1,\}$') ]; then
			EXTRA=" --host=$DB_HOSTNAME --port=$DB_SOCK_OR_PORT --protocol=tcp"
		elif ! [ -z $DB_SOCK_OR_PORT ] ; then
			EXTRA=" --socket=$DB_SOCK_OR_PORT"
		elif ! [ -z $DB_HOSTNAME ] ; then
			EXTRA=" --host=$DB_HOSTNAME --protocol=tcp"
		fi
	fi

	# create database
	mysqladmin create $DB_NAME --user="$DB_USER" --password="$DB_PASS"$EXTRA
}

install_e2e_site() {
	# if [[ ${RUN_E2E} == 1 ]]; then
	# fi

	# Script Variables
	CONFIG_DIR="./tests/e2e/config/travis"
	WP_CORE_DIR="$HOME/wordpress"
	NGINX_DIR="$HOME/nginx"
	PHP_FPM_BIN="$HOME/.phpenv/versions/$TRAVIS_PHP_VERSION/sbin/php-fpm"
	PHP_FPM_CONF="$NGINX_DIR/php-fpm.conf"
	# WP_SITE_URL="http://$TRAVIS_COMMIT.ngrok.io:8080"
	WP_SITE_URL="http://localhost:8080"
	BRANCH=$TRAVIS_BRANCH
	REPO=$TRAVIS_REPO_SLUG
	WORKING_DIR="$PWD"

	if [ "$TRAVIS_PULL_REQUEST_BRANCH" != "" ]; then
		BRANCH=$TRAVIS_PULL_REQUEST_BRANCH
		REPO=$TRAVIS_PULL_REQUEST_SLUG
	fi

	set -ev
	npm install
	export NODE_CONFIG_DIR="./tests/e2e/config"

	# Set up nginx to run the server
	mkdir -p "$WP_CORE_DIR"
	mkdir -p "$NGINX_DIR"
	mkdir -p "$NGINX_DIR/sites-enabled"
	mkdir -p "$NGINX_DIR/var"

	# Copy the default nginx config files
	cp "$CONFIG_DIR/travis_php-fpm.conf" "$PHP_FPM_CONF"
	cp "$CONFIG_DIR/travis_nginx.conf" "$NGINX_DIR/nginx.conf"
	cp "$CONFIG_DIR/travis_fastcgi.conf" "$NGINX_DIR/fastcgi.conf"
	cp "$CONFIG_DIR/travis_default-site.conf" "$NGINX_DIR/sites-enabled/default-site.conf"

	# Start php-fpm
	"$PHP_FPM_BIN" --fpm-config "$PHP_FPM_CONF"

	# Start nginx.
	nginx -c "$NGINX_DIR/nginx.conf"

	# Set up WordPress using wp-cli
	cd "$WP_CORE_DIR"

	curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
	php wp-cli.phar core download --version=$WP_VERSION
	php wp-cli.phar core config --dbname=$DB_NAME --dbuser=$DB_USER --dbpass=$DB_PASS --dbhost=$DB_HOST --dbprefix=wp_ --extra-php <<PHP
/* Change WP_MEMORY_LIMIT to increase the memory limit for public pages. */
define('WP_MEMORY_LIMIT', '256M');
define('SCRIPT_DEBUG', true);
PHP

	echo "Setting other wp-config.php constants..."
	php wp-cli.phar --allow-root config set WP_DEBUG true --raw --type=constant
	php wp-cli.phar --allow-root config set WP_DEBUG_LOG true --raw --type=constant
	php wp-cli.phar --allow-root config set WP_DEBUG_DISPLAY false --raw --type=constant

	php wp-cli.phar db create

	php wp-cli.phar core install --url="$WP_SITE_URL" --title="E2E Gutenpack blocks" --admin_user=admin --admin_password=password --admin_email=admin@e2ewootestsite.com --path=$WP_CORE_DIR
	# php wp-cli.phar theme install twentyseventeen --activate
	# php wp-cli.phar plugin install woocommerce --activate

	php wp-cli.phar user create customer customer@e2ewootestsite.com --user_pass=customer_password --role=customer --path=$WP_CORE_DIR

	# Copying contents of bookings branch manually, since unable to download a private repo zip
	cp -r $WORKING_DIR/../jetpack $WP_CORE_DIR/wp-content/plugins/
	php wp-cli.phar plugin activate jetpack

	cd "$WORKING_DIR"
}

install_ngrok() {
	# download and install ngrok
	curl -s https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip > ngrok.zip
	unzip ngrok.zip
	./ngrok authtoken $NGROK_TOKEN
	./ngrok http -log=stdout -subdomain=$TRAVIS_COMMIT 8080 > /dev/null &
}

install_ngrok
# install_db
install_e2e_site

curl -v localhost
curl -v localhost:8080
curl -v http://localhost:8080

