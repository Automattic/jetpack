#!/bin/bash

set -eo pipefail

VER="$1"
DIR="/usr/local/src/phpunit-for-$VER/$( basename "$PWD" )"
shift

/var/scripts/ensure-php-version.sh "$VER"

printf '\n\e[1m== Installing Composer deps for PHP %s externally ==\e[0m\n' "$VER"
mkdir -p "$DIR"
jq --arg PWD "$PWD" --arg VER "$( "php$VER" -r 'printf( "%d.%d.%d", PHP_MAJOR_VERSION, PHP_MINOR_VERSION, PHP_RELEASE_VERSION );' )" '
	{
		config: {
			platform: {
				php: $VER,
			},
		},
		repositories: [
			{
				type: "path",
				url: ( $PWD + "/../../packages/*" ),
				options: {
					monorepo: true,
				},
			}
		],
		"require-dev": .["require-dev"],
	}
' composer.json > "$DIR/composer.json"
composer --working-dir="$DIR" update

printf '\n\e[1m== Uninstalling Composer dev deps from monorepo ==\e[0m\n'
composer install --no-dev
# The above may have created files owned by the in-docker user ID, which probably doesn't match the user ID on the host system.
# Avoid confusing users later by changing the ownership of such files.
if [[ $(stat -c %u .) -ne $EUID ]]; then
	find -P vendor jetpack_vendor -xdev -user "$EUID" -exec chown --reference=. -h {} + &>/dev/null || true
fi

echo
printf '\e[30;43m ** Note contents of vendor/ have been changed!                        ** \e[0m\n'
printf '\e[30;43m ** You may want to run `jetpack install` when done testing to fix it. ** \e[0m\n'

printf '\n\e[1m== Running phpunit ==\e[0m\n'
export DOCKER_PHPUNIT_BASE_DIR="$DIR"
exec "php$VER" "$DIR/vendor/bin/phpunit" "$@"
