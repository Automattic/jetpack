#!/bin/bash

set -eo pipefail

source "$GITHUB_WORKSPACE/trunk/.github/files/gh-funcs.sh"

ZIPDIR="$GITHUB_WORKSPACE/zips"
EXIT=0

SLUGS=()
cd "$ZIPDIR"
for ZIP in *-dev.zip; do
	SLUGS+=( "${ZIP%-dev.zip}" )
done

FINISHED=false
OUTPUT=()

function onexit {
	if ! "$FINISHED"; then
		OUTPUT+=( "💣 The testing script exited unexpectedly." )
	fi
	gh_set_output info "$( printf "%s\n" "${OUTPUT[@]}" )"
}
trap "onexit" EXIT

function failed {
	ERRMSG="$1"
	OUTPUT+=( "❌ $ERRMSG" )
	FAILED=1
	EXIT=1
}

cd /var/www/html
for SLUG in "${SLUGS[@]}"; do
	for FROM in stable trunk dev; do
		for HOW in web cli; do
			[[ -e "$ZIPDIR/$SLUG-$FROM.zip" ]] || continue

			FAILED=
			printf '\n\e[1mTest upgrade of %s from %s via %s\e[0m\n' "$SLUG" "$FROM" "$HOW"

			ERRMSG=
			echo "::group::Installing $SLUG $FROM"
			: > /var/www/html/wp-content/debug.log
			if ! wp --allow-root plugin install --activate "$ZIPDIR/$SLUG-$FROM.zip"; then
				failed "Plugin install failed for $SLUG $FROM!"
			fi
			echo '== Debug log =='
			cat /var/www/html/wp-content/debug.log
			rm -f "/var/www/html/wp-content/plugins/$SLUG/ci-flag.txt"
			echo "::endgroup::"
			if [[ -n "$ERRMSG" ]]; then
				rm -rf "/var/www/html/wp-content/plugins/$SLUG"
				echo "::error::$ERRMSG"
				continue
			fi

			# TODO: Connect Jetpack, since most upgrades will happen while connected.

			ERRMSG=
			echo "::group::Upgrading $SLUG via $HOW"
			P="$(wp --allow-root plugin path "$SLUG" | sed 's!^/var/www/html/wp-content/plugins/!!')"
			wp --allow-root --quiet option set fake_plugin_update_plugin "$P"
			wp --allow-root --quiet option set fake_plugin_update_url "$ZIPDIR/$SLUG-dev.zip"
			: > /var/www/html/wp-content/debug.log
			if [[ "$HOW" == 'cli' ]]; then
				if ! wp --allow-root plugin upgrade "$SLUG" 2>&1 | tee "$GITHUB_WORKSPACE/out.txt"; then
					failed "CLI upgrade of $SLUG from $FROM exited with a non-zero status"
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
			if [[ -n "$ERRMSG" ]]; then
				echo "::error::$ERRMSG"
			fi
			ERR="$(grep -i 'Fatal error' /var/www/html/wp-content/debug.log || true)"
			if [[ -n "$ERR" ]]; then
				failed "Mid-upgrade fatal detected for $SLUG $HOW update from $FROM!%0A$ERR"
				echo "::error::$ERRMSG"
			elif [[ ! -e "/var/www/html/wp-content/plugins/$SLUG/ci-flag.txt" ]]; then
				failed "Plugin $SLUG ($HOW update from $FROM) does not seem to have been updated?"
				echo "::error::$ERRMSG"
			fi

			ERRMSG=
			echo "::group::Deactivating $SLUG"
			: > /var/www/html/wp-content/debug.log
			if ! wp --allow-root plugin deactivate "$SLUG"; then
				failed "Plugin deactivate failed after $SLUG $HOW update from $FROM!"
			fi
			echo '== Debug log =='
			cat /var/www/html/wp-content/debug.log
			echo '::endgroup::'
			if [[ -n "$ERRMSG" ]]; then
				echo "::error::$ERRMSG"
			fi

			ERRMSG=
			echo "::group::Uninstalling $SLUG"
			: > /var/www/html/wp-content/debug.log
			if ! wp --allow-root plugin uninstall "$SLUG"; then
				failed "Plugin uninstall failed after $SLUG $HOW update from $FROM!"
				rm -rf "/var/www/html/wp-content/plugins/$SLUG"
			fi
			echo '== Debug log =='
			cat /var/www/html/wp-content/debug.log
			echo "::endgroup::"
			if [[ -n "$ERRMSG" ]]; then
				echo "::error::$ERRMSG"
			fi

			wp --allow-root --quiet option delete fake_plugin_update_plugin
			wp --allow-root --quiet option delete fake_plugin_update_url

			if [[ -z "$FAILED" ]]; then
				OUTPUT+=( "✅ Upgrade of $SLUG from $FROM via $HOW succeeded!" )
			fi
		done
	done
done

FINISHED=true
exit $EXIT
