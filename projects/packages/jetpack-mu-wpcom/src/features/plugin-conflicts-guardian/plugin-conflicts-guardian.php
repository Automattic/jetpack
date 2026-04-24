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

// upgrader_source_selection / upgrader_pre_install / upgrader_process_complete
// all fire for cron auto-updates and WP-CLI flows too — not just admin
// requests — so the upgrade-time files are loaded unconditionally.
require_once __DIR__ . '/update-guard.php';
require_once __DIR__ . '/class-pcg-snapshot.php';
require_once __DIR__ . '/class-pcg-rollback.php';
require_once __DIR__ . '/update-healthcheck.php';

// load-plugins.php / load-update.php only fire on admin requests, so
// the activation guard stays gated.
if ( is_admin() ) {
	require_once __DIR__ . '/activation-guard.php';
}
