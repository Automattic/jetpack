<?php
/**
 * Plugin Conflicts Guardian — pre-flight plugin-activation check.
 *
 * Intercepts plugin activations (plugins.php + update.php entry
 * points) and runs the prospective plugin in a short-lived HTTP
 * self-request. If that probe captures a fatal during load or during
 * the `init` / `admin_init` cycle, the activation is refused and
 * the admin sees a clear error notice — the site stays up instead of
 * entering recovery mode.
 *
 * Layout:
 *   class-pcg-load-tester.php  Client-side: fires the probe HTTP request.
 *   probe-endpoint.php         Server-side: handles `?pcg_probe=1`,
 *                              requires the plugin, captures any fatal.
 *   activation-guard.php       Hooks `load-plugins.php` / `load-update.php`
 *                              and blocks activations that fail the probe.
 *
 * Gated behind `apply_filters( 'pcg_enable', false )` so the feature
 * ships dark on WP.com until a site opts in. When enabled, the
 * activation guard can be turned off independently via
 * `apply_filters( 'pcg_guard_activation', $bool )` (default true).
 *
 * @package automattic/jetpack-mu-wpcom
 */

// Dummy comment so PHPCS treats the block above as the file doc comment.
require_once __DIR__ . '/class-pcg-load-tester.php';

if ( apply_filters( 'pcg_enable', false ) ) {
	// The probe endpoint must be reachable on front-end requests
	// (wp_remote_get targets home_url), so it's registered here
	// unconditionally rather than gated to is_admin().
	require_once __DIR__ . '/probe-endpoint.php';

	if ( is_admin() ) {
		require_once __DIR__ . '/activation-guard.php';
	}
}
