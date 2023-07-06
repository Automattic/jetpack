#!/bin/bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

TMPDIR="${TMPDIR:-/tmp}"
DIR="$(mktemp -d "${TMPDIR%/}/pr-is-up-to-date.XXXXXXXX")"
trap 'rm -rf "$DIR"' EXIT
cd "$DIR"

PHP_VERSIONS=( 5.6 7.0 7.1 7.2 7.3 7.4 8.0 8.1 8.2 )

function info {
	printf '\n\e[1m%s\e[0m\n' "$*"
}

# We make the assumption that PHPCompatibility has comprehensive tests written around running phpcs against files named `*.inc`,
# so if we run phpcs over those files, every rule and message will be triggered.
info "== Cloning PHPCompatibility/PHPCompatibility =="
git clone --depth=1 https://github.com/PHPCompatibility/PHPCompatibility
mapfile -t FILES < <( find PHPCompatibility/PHPCompatibility/Tests/ -name \*.inc )

# Set up composer for installing packages.
info "== Setting up composer =="
echo '{}' > composer.json
composer config --no-interaction allow-plugins.dealerdirect/phpcodesniffer-composer-installer true
composer require --dev dealerdirect/phpcodesniffer-composer-installer

# Install the dev-develop version to get all the current rules.
info "== Getting rules with phpcompatibility/php-compatibility=dev-develop =="
composer require --dev phpcompatibility/php-compatibility=dev-develop
for V in "${PHP_VERSIONS[@]}"; do
	info "=== PHP $V ==="
	{ vendor/bin/phpcs -p -s --report-width=10000 --standard=PHPCompatibility --runtime-set testVersion "$V-" "${FILES[@]}" || true; } | sed -n 's/.* (\(PHPCompatibility\.[^)]\+\))$/\1/p' | sort -u > dev-$V.txt
	echo "Got $(grep -c . "dev-$V.txt") rules"
done

# Replace with phpcompatibility/phpcompatibility-wp to get any renamed rules from that version.
info "== Getting rules with phpcompatibility/phpcompatibility-wp =="
composer remove --dev phpcompatibility/php-compatibility
composer require --dev phpcompatibility/phpcompatibility-wp
# Hotfix for a bug in one of the rulesets.
sed -i.bak 's!$message = vsprintf($message, $data);!$message = vsprintf($message, (array) $data);!' vendor/squizlabs/php_codesniffer/src/Files/File.php
for V in "${PHP_VERSIONS[@]}"; do
	info "=== PHP $V ==="
	{ vendor/bin/phpcs -p -s --report-width=10000 --standard=PHPCompatibilityWP --runtime-set testVersion "$V-" "${FILES[@]}" || true; } | sed -n 's/.* (\(PHPCompatibility\.[^)]\+\))$/\1/p' | sort -u > wp-$V.txt
	echo "Got $(grep -c . "wp-$V.txt") rules"
done

# Process the rules lists to get incremental lists for each version.
info "== Processing rules lists =="
F=( -f /dev/null )
V0="${PHP_VERSIONS[0]}"
for V in "${PHP_VERSIONS[@]:1}"; do
	{ diff -u <( sort -u "dev-$V0.txt" "wp-$V0.txt" ) <( sort -u "dev-$V.txt" "wp-$V.txt" ) || true; } | sed -n 's/^-\(PHPCompatibility\.\)/\1/p' | grep -vFx "${F[@]}" > "$V.txt"
	F+=( -f "$V.txt" )
	echo "Found $(grep -c . "$V.txt") rules that no longer apply in PHP $V"
done

# Go back to the monorepo and build the rulesets.
info "== Generating Jetpack-Compat rulesets =="
cd "$BASE"
rm Jetpack-Compat-*/ruleset.xml
rmdir Jetpack-Compat-*
P='<rule ref="PHPCompatibility">'
for V in "${PHP_VERSIONS[@]:1}"; do
	VV=${V//./}
	printf 'Jetpack-Compat-%s... ' "$VV"
	mkdir "Jetpack-Compat-$VV"
	cat > "Jetpack-Compat-$VV/ruleset.xml" <<EOF
<?xml version="1.0"?>
<ruleset name="Jetpack-Compat-$VV">
	<description>Standard to disable PHPCompatibility rules that trigger with 5.6 but not $V.</description>

	$P
EOF
	sed 's!.*!\t\t<exclude name="&" />!' "$DIR/$V.txt" >> "Jetpack-Compat-$VV/ruleset.xml"
	echo $'\t</rule>\n</ruleset>' >> "Jetpack-Compat-$VV/ruleset.xml"

	P="<rule ref=\"Jetpack-Compat-$VV\">"

	echo "done!"
done
