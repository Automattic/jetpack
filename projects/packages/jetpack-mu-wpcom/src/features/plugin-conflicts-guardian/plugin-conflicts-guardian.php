<?php
/**
 * Plugin Conflicts Guardian — pre-flight plugin-activation check.
 *
 * See README.md for how it works.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Load dependencies.
 */
require_once __DIR__ . '/class-pcg-load-tester.php';

// Probe endpoint must answer front-end requests, so it's not gated on is_admin().
require_once __DIR__ . '/probe-endpoint.php';

// upgrader_source_selection fires for cron auto-updates too, not just
// admin requests, so the update guard is loaded unconditionally.
require_once __DIR__ . '/update-guard.php';

// load-plugins.php / load-update.php only fire on admin requests, so
// the activation guard stays gated.
if ( is_admin() ) {
	require_once __DIR__ . '/activation-guard.php';
}
