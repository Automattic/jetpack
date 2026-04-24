<?php
/**
 * Plugin Conflicts Guardian — pre-flight plugin-activation check.
 *
 * See README.md for an overview, the activation/update flows, and why
 * the probe uses an HTTP self-request rather than a CLI subprocess.
 *
 * @package automattic/jetpack-mu-wpcom
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/class-pcg-load-tester.php';

// Probe endpoint must answer front-end requests, so it's not gated on is_admin().
require_once __DIR__ . '/probe-endpoint.php';

if ( is_admin() ) {
	require_once __DIR__ . '/activation-guard.php';
	require_once __DIR__ . '/update-guard.php';
}
