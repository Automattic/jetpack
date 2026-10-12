#!/usr/bin/env bash
# Starts the E2E site on localhost without the encrypted config or a tunnel; CI uses env:up instead.
set -e

# The CLI's readiness check only follows --port, not the PORT_WORDPRESS environment variable.
PORT="${PORT_WORDPRESS:-8889}"
D=( pnpm jetpack docker --type e2e --name t1 )
"${D[@]}" up -d --port "$PORT"
"${D[@]}" install || true

# Mirrors configure_wp_env in tools/e2e-commons/bin/e2e-env.sh, so local runs see the site CI sees.
"${D[@]}" exec-silent -- chown -R www-data:www-data /var/www/html/wp-content/uploads
"${D[@]}" exec-silent -- mkdir -p /var/www/html/wp-content/jetpack-waf
"${D[@]}" exec-silent -- chown -R www-data:www-data /var/www/html/wp-content/jetpack-waf
for plugin in jetpack e2e-direct-filesystem e2e-plan-helper e2e-waf-data-interceptor e2e-search-test-helper e2e-wpcom-request-interceptor e2e-premium-analytics-helper; do
	"${D[@]}" wp -- plugin activate "$plugin"
done
"${D[@]}" wp -- option set permalink_structure ""
for module in sso account-protection protect; do
	"${D[@]}" wp -- jetpack module deactivate "$module"
done
