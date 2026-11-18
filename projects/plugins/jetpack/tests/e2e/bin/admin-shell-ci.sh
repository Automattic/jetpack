#!/usr/bin/env bash

# Runs the admin shell suite against the e2e Docker site from `pnpm env:up`: hover side effects, shell on, then shell off.
# Extra arguments go to every Playwright run. ADMIN_SHELL_SMOKE=1 runs only the @smoke tests.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

WP=( pnpm jetpack docker --type e2e --name t1 wp -- )

ADMIN_SHELL_USER=$( node -p 'require( "./config/local.cjs" ).testSites.default.username' ) || exit 1
ADMIN_SHELL_PASSWORD=$( node -p 'require( "./config/local.cjs" ).testSites.default.password' ) || exit 1
export ADMIN_SHELL_USER ADMIN_SHELL_PASSWORD
# The shell-off run points ADMIN_SHELL_OFF_URL at the same site; this matches the config's default.
SITE_URL=${ADMIN_SHELL_URL:-http://localhost:8889}

# Comma-separated; playwright.admin-shell.config.ts runs the same list.
IFS=, read -ra BROWSERS <<<"${ADMIN_SHELL_BROWSERS:-chromium,firefox,webkit}"
# The runner image already has what Chromium needs; Firefox and WebKit need system packages.
if [[ "${BROWSERS[*]}" == chromium ]]; then
	playwright install chromium || exit 1
else
	playwright install --with-deps "${BROWSERS[@]}" || exit 1
fi

# The site is never connected, so default modules (including the Forms and Podcast members) aren't auto-activated.
# Do this before e2e-admin-shell takes the site out of offline mode, where an unconnected site refuses activation.
for module in contact-form podcast; do
	"${WP[@]}" jetpack module activate "$module" || exit 1
done

STATUS=0
# A 4-core runner: the browsers and the site share it.
export PLAYWRIGHT_WORKERS=${PLAYWRIGHT_WORKERS:-4}

echo "::group::Shell on"
"${WP[@]}" plugin activate e2e-admin-shell || exit 1
# Jetpack AI's sidebar item shows only with the ai module on, and it needs the stubbed connection to activate.
"${WP[@]}" jetpack module activate ai || exit 1
"${WP[@]}" option delete e2e_admin_shell_off >/dev/null 2>&1
# A run of its own, first: other tests' requests would mix into the hover test's write log.
if [[ "${ADMIN_SHELL_SMOKE:-}" != 1 ]]; then
	ADMIN_SHELL_RUN=hover ADMIN_SHELL_HOVER=1 playwright test -c playwright.admin-shell.config.ts --project='hover side effects' "$@" || STATUS=1
fi
ADMIN_SHELL_RUN=shell-on playwright test -c playwright.admin-shell.config.ts --project='shell on: *' "$@" || STATUS=1
echo "::endgroup::"

echo "::group::Shell off"
"${WP[@]}" option update e2e_admin_shell_off 1 || exit 1
# One worker: both logins run here, and two at once on one site can stall each other.
ADMIN_SHELL_RUN=shell-off PLAYWRIGHT_WORKERS=1 ADMIN_SHELL_OFF_URL="$SITE_URL" \
	ADMIN_SHELL_OFF_USER="$ADMIN_SHELL_USER" ADMIN_SHELL_OFF_PASSWORD="$ADMIN_SHELL_PASSWORD" \
	playwright test -c playwright.admin-shell.config.ts --project='shell off: *' "$@" || STATUS=1
echo "::endgroup::"

exit $STATUS
