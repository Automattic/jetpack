#!/bin/bash

set -eo pipefail

ZIPDIR="$GITHUB_WORKSPACE/zips"
EXIT=0

SLUGS=()
cd "$ZIPDIR"
for ZIP in *-dev.zip; do
	SLUGS+=( "${ZIP%-dev.zip}" )
done

cd /var/www/html
for SLUG in "${SLUGS[@]}"; do
	for FROM in stable master dev; do
		for HOW in web cli; do
			[[ -e "$ZIPDIR/$SLUG-$FROM.zip" ]] || continue

			echo "::group::Installing $SLUG $FROM"
			wp --allow-root plugin install --activate "$ZIPDIR/$SLUG-$FROM.zip"
			rm -f "/var/www/html/wp-content/plugins/$SLUG/ci-flag.txt"
			# TODO: Connect Jetpack, since most upgrades will happen while connected.
			echo "::endgroup::"

			echo "::group::Upgrading $SLUG via $HOW"
			P="$(wp --allow-root plugin path "$SLUG" | sed 's!^/var/www/html/wp-content/plugins/!!')"
			wp --allow-root --quiet option set fake_plugin_update_plugin "$P"
			wp --allow-root --quiet option set fake_plugin_update_url "$ZIPDIR/$SLUG-dev.zip"
			: > /var/www/html/wp-content/debug.log
			if [[ "$HOW" == 'cli' ]]; then
				if ! wp --allow-root plugin upgrade "$SLUG" 2>&1 | tee "$GITHUB_WORKSPACE/out.txt"; then
					echo "::error::CLI upgrade of $SLUG from $FROM exited with a non-zero status"
					EXIT=1
				fi
			else
				# Everything needs to be owned by www-data for the web upgrade to proceed.
				chown -R www-data:www-data /var/www/html
				curl -v --get --url 'http://localhost/wp-admin/update.php?action=upgrade-plugin&_wpnonce=bogus' --data "plugin=$P" --output "$GITHUB_WORKSPACE/out.txt" 2>&1
				cat "$GITHUB_WORKSPACE/out.txt"
			fi
			echo '== Debug log =='
			cat /var/www/html/wp-content/debug.log
			echo "::endgroup::"
			ERR="$(grep -i 'Fatal error' /var/www/html/wp-content/debug.log || true)"
			if [[ -n "$ERR" ]]; then
				echo "::error::Mid-upgrade fatal detected for $SLUG $HOW update from $FROM!%0A$ERR"
				EXIT=1
			elif [[ ! -e "/var/www/html/wp-content/plugins/$SLUG/ci-flag.txt" ]]; then
				echo "::error::Plugin $SLUG ($HOW update from $FROM) does not seem to have been updated?"
				EXIT=1
			fi

			echo "::group::Uninstalling $SLUG"
			wp --allow-root plugin deactivate "$SLUG"
			wp --allow-root plugin uninstall "$SLUG"
			wp --allow-root --quiet option delete fake_plugin_update_plugin
			wp --allow-root --quiet option delete fake_plugin_update_url
			echo "::endgroup::"
		done
	done
done

exit $EXIT
