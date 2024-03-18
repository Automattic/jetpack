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
	"php${VER}"
	"php${VER}-ast"
	"php${VER}-bcmath"
	"php${VER}-cli"
	"php${VER}-curl"
	"php${VER}-fpm"
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
