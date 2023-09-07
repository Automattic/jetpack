#!/bin/bash

set -eo pipefail

source /etc/docker-args.sh

VER=$1
if [[ "$1" == default ]]; then
	VER="$PHP_VERSION"
elif [[ ! "$1" =~ ^[0-9]+\.[0-9]+$ ]]; then
	cat <<-EOF
		USAGE: $0 <version>

		<version> may be "default" or a two-part version number like "$PHP_VERSION".
	EOF
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# Determine packages to install.
PKGS=(
	"libapache2-mod-php${VER}"
	"php${VER}"
	"php${VER}-bcmath"
	"php${VER}-cli"
	"php${VER}-curl"
	"php${VER}-intl"
	"php${VER}-ldap"
	"php${VER}-mbstring"
	"php${VER}-mysql"
	"php${VER}-opcache"
	"php${VER}-pgsql"
	"php${VER}-soap"
	"php${VER}-sqlite3"
	"php${VER}-xdebug"
	"php${VER}-xml"
	"php${VER}-xsl"
	"php${VER}-zip"
)
NO_RECOMMENDS_PKGS=(
	"php${VER}-apcu"
	"php${VER}-gd"
	"php${VER}-imagick"
)

# php-json is built in in 8.0+.
if [[ "$VER" == [57].* ]]; then
	PKGS+=( "php${VER}-json" )
fi

# Install selected packages.
printf '\e[1m== Installing PHP %s ==\e[0m\n' "$VER"
apt-get update -q
apt-get install -qy "${PKGS[@]}"
apt-get install -qy --no-install-recommends "${NO_RECOMMENDS_PKGS[@]}"

# Enable our custom config for the new version.
[[ -e "/etc/php/${VER}/mods-available/jetpack-wordpress.ini" ]] || ln -s /var/lib/jetpack-config/php.ini "/etc/php/${VER}/mods-available/jetpack-wordpress.ini"
phpenmod -v "$VER" jetpack-wordpress

# Upgrade or downgrade Composer if necessary.
if command -v composer &> /dev/null; then
	printf '\n\e[1m== Installing Composer ==\e[0m\n'
	if [[ "$VER" == 5.6 || "$VER" == 7.[01] ]]; then
		CV=2.2.18
	else
		CV="$COMPOSER_VERSION"
	fi
	# Execute with whichever version of PHP is newer.
	if php -r 'exit( version_compare( PHP_VERSION, $argv[1], ">" ) ? 0 : 1 );' "$PHP_VERSION"; then
		composer self-update "$CV"
	else
		"php$VER" "$(command -v composer)" self-update "$CV"
	fi
fi

# Select the new version to be used for stuff.
printf '\n\e[1m== Setting PHP %s as default ==\e[0m\n' "$VER"
for name in php phar phar.phar; do
	update-alternatives --quiet --set "$name" "/usr/bin/$name$VER"
done
if a2query -m | grep -q "^php$VER "; then
	:
else
	if a2query -m | grep -q '^php'; then
		a2dismod 'php*'
	fi
	a2enmod "php$VER"

	printf '\n\e[30;43mThe web server is still running the old version of PHP!\e[0m\n'
	printf '\e[30;43mRestart the docker container (e.g. `jetpack docker stop && jetpack docker up -d`) to use the new version.\e[0m\n'
fi
