#!/usr/bin/env bash
# see https://github.com/wp-cli/wp-cli/blob/master/templates/install-wp-tests.sh

set -ex

DB_NAME=${4-jetpack_test}
DB_USER=${4-root}
DB_PASS=${4-}
DB_HOST=${4-localhost}
WP_VERSION=${5-latest}

WP_CORE_DIR=${WP_CORE_DIR-$HOME/wordpress}

BRANCH=$TRAVIS_BRANCH
REPO=$TRAVIS_REPO_SLUG
WORKING_DIR="$PWD"

if [ "$TRAVIS_PULL_REQUEST_BRANCH" != "" ]; then
	BRANCH=$TRAVIS_PULL_REQUEST_BRANCH
	REPO=$TRAVIS_PULL_REQUEST_SLUG
fi

get_ngrok_url() {
	echo $(curl -s localhost:4040/api/tunnels/command_line | jq --raw-output .public_url)
}

kill_ngrok() {
	ps aux | grep -i ngrok | awk '{print $2}' | xargs kill -9 || true
}

# ngrok API docs: https://ngrok.com/docs#client-api
restart_tunnel() {
	curl -X "DELETE" localhost:4040/api/tunnels/command_line

	curl -X POST -H "Content-Type: application/json" -d '{"name":"command_line","addr":"http://localhost:80","proto":"http"}' localhost:4040/api/tunnels

	sleep 3
	WP_SITE_URL=$(get_ngrok_url)
}

install_ngrok() {
	if $(type -t "ngrok" >/dev/null 2>&1); then
		NGROK_CMD="ngrok"
		return
	fi

	if [ -z "$CI" ]; then
		echo "Please install ngrok on your machine. Instructions: https://ngrok.com/download"
		exit 1
	fi

	echo "Installing ngrok in CI..."
	curl -s https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip > ngrok.zip
	unzip -o ngrok.zip
	NGROK_CMD="./ngrok"
}

start_ngrok() {
	echo "Killing any rogue ngrok instances just in case..."
	kill_ngrok

	if [ ! -z "$NGROK_KEY" ]; then
			$NGROK_CMD authtoken $NGROK_KEY
	fi

 $NGROK_CMD http -log=stdout 80 > /dev/null &

	sleep 3
	WP_SITE_URL=$(get_ngrok_url)

	if [ -z "$WP_SITE_URL" ]; then
		echo "WP_SITE_URL is not set after launching an ngrok"
		exit 1
	fi
}

setup_nginx() {
	NGINX_DIR="/etc/nginx"
	CONFIG_DIR="./tests/e2e/bin/travis"
	PHP_FPM_BIN="$HOME/.phpenv/versions/$TRAVIS_PHP_VERSION/sbin/php-fpm"
	PHP_FPM_CONF="$NGINX_DIR/php-fpm.conf"

	# remove default nginx site configs
	sudo rm "$NGINX_DIR/sites-available/default"
	sudo rm "$NGINX_DIR/sites-enabled/default"

	# Copy the default nginx config files
	sudo cp "$CONFIG_DIR/travis_php-fpm.conf" "$PHP_FPM_CONF"
	sudo cp "$CONFIG_DIR/travis_fastcgi.conf" "$NGINX_DIR/fastcgi.conf"


	# Figure out domain name and replace the value in config
	# DOMAIN_NAME=$(echo $WP_SITE_URL | awk -F/ '{print $3}')
	# DOMAIN_NAME="localhost"
	DOMAIN_NAME="*.ngrok.io"
	if [ -z "$DOMAIN_NAME" ]; then
		echo "DOMAIN_NAME is empty! Does ngrok started correctly?"
		exit 1
	fi

	SED_ARG="s+%WP_DOMAIN%+$DOMAIN_NAME+g"
	sed -i $SED_ARG $CONFIG_DIR/travis_default-site.conf

	sudo cp "$CONFIG_DIR/travis_default-site.conf" "$NGINX_DIR/sites-available/default"
	sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

	# grands www-data user access to wordpress instalation
	sudo gpasswd -a www-data travis

	# Start php-fpm
	"$PHP_FPM_BIN" --fpm-config "$PHP_FPM_CONF"

	# Start nginx.
	sudo service nginx restart
}

install_wp() {
	# Set up WordPress using wp-cli
	mkdir -p "$WP_CORE_DIR"
	cd "$WP_CORE_DIR"

	curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
	chmod +x wp-cli.phar
	sudo mv wp-cli.phar /usr/local/bin/wp

	wp core download --version=$WP_VERSION
	wp core config --dbname=$DB_NAME --dbuser=$DB_USER --dbpass=$DB_PASS --dbhost=$DB_HOST --dbprefix=wp_ --extra-php <<PHP
/* Change WP_MEMORY_LIMIT to increase the memory limit for public pages. */
define('WP_MEMORY_LIMIT', '256M');
define('SCRIPT_DEBUG', true);

/* Tweak to fix TOO_MANY_REDIRECTS ngrok problem */
if (isset(\$_SERVER['HTTP_X_FORWARDED_PROTO']) && \$_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https')
    \$_SERVER['HTTPS'] = 'on';
PHP

	echo "Setting other wp-config.php constants..."
	wp --allow-root config set WP_DEBUG true --raw --type=constant
	wp --allow-root config set WP_DEBUG_LOG true --raw --type=constant
	wp --allow-root config set WP_DEBUG_DISPLAY false --raw --type=constant

	# NOTE: Force classic connection flow
	# https://github.com/Automattic/jetpack/pull/13288
	wp --allow-root config set JETPACK_SHOULD_USE_CONNECTION_IFRAME false --raw --type=constant

	wp db create

	wp core install --url="$WP_SITE_URL" --title="E2E Gutenpack blocks" --admin_user=wordpress --admin_password=wordpress --admin_email=wordpress@example.com --path=$WP_CORE_DIR
}

prepare_jetpack() {
	cd "$WP_CORE_DIR"
	# Copying contents of bookings branch manually, since unable to download a private repo zip
	ln -s $WORKING_DIR $WP_CORE_DIR/wp-content/plugins/

	wp plugin activate jetpack
}

if [ "${1}" == "reset_wp" ]; then
	echo "Resetting WordPress"
	restart_tunnel

	echo "WP SITE URL: $WP_SITE_URL"

	wp --path=$WP_CORE_DIR db reset --yes
	wp --path=$WP_CORE_DIR core install --url="$WP_SITE_URL" --title="E2E Gutenpack blocks" --admin_user=wordpress --admin_password=wordpress --admin_email=wordpress@example.com
	wp --path=$WP_CORE_DIR plugin activate jetpack
else
	install_ngrok
	start_ngrok

	setup_nginx

	install_wp
	prepare_jetpack
fi

echo $WP_SITE_URL
