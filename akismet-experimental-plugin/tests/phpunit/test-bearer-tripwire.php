<?php
/**
 * Guardrail tripwire: GUARDRAILS.md mandates that the Blackbox Bearer key
 * (AKISMET_BLACKBOX_API_KEY) is never serialized to the browser via the
 * `wp_localize_script` payload.
 *
 * Plain-PHP test: runs from CLI without WP_UnitTestCase. Inspects
 * `Akismet_Experimental::blackbox_client_config()` via reflection.
 *
 *   php tests/phpunit/test-bearer-tripwire.php
 *
 * Exits 0 on pass, 1 on fail.
 *
 * @package Akismet_Experimental
 */

// Stub WP entry-guard so requiring the class doesn't bail.
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ );
}

// Stub the WP functions the class calls so we can `require_once` without booting WordPress.
if ( ! function_exists( 'add_action' ) ) {
	function add_action() {} // phpcs:ignore
}
if ( ! function_exists( 'current_user_can' ) ) {
	function current_user_can() { return false; } // phpcs:ignore
}

// Set the guardrail constants for the test.
define( 'AKISMET_EXPERIMENTAL_UI', true );
define( 'AKISMET_BLACKBOX_API_KEY', 'SECRET_BEARER_DO_NOT_LEAK' );
define( 'AKISMET_BLACKBOX_CLIENT_ID', 'bbx_test_client' );

require_once dirname( __DIR__, 2 ) . '/class.akismet-experimental.php';

$reflection = new ReflectionMethod( 'Akismet_Experimental', 'blackbox_client_config' );
if ( PHP_VERSION_ID < 80100 ) {
	$reflection->setAccessible( true ); // No-op since PHP 8.1.
}
$config = $reflection->invoke( null );

$failures = array();

// The keys that ARE allowed.
$allowed = array( 'enrolled', 'clientId', 'apiHost' );

// The keys that MUST NEVER appear.
$forbidden = array( 'apiKey', 'bearer', 'apiSecret', 'token', 'secret' );

foreach ( $forbidden as $key ) {
	if ( array_key_exists( $key, $config ) ) {
		$failures[] = "FAIL: forbidden key '{$key}' present in blackbox_client_config()";
	}
}

// Confirm only allowed keys are present.
$unknown_keys = array_diff( array_keys( $config ), $allowed );
if ( ! empty( $unknown_keys ) ) {
	$failures[] = 'FAIL: unexpected key(s) in payload: ' . implode( ', ', $unknown_keys );
}

// Confirm the Bearer value itself isn't present anywhere in serialized output.
$serialized = wp_json_encode_polyfill( $config );
if ( strpos( $serialized, 'SECRET_BEARER_DO_NOT_LEAK' ) !== false ) {
	$failures[] = 'FAIL: Bearer key value appeared in serialized config payload';
}

// Confirm expected positive cases.
if ( $config['enrolled'] !== true ) {
	$failures[] = 'FAIL: expected enrolled=true with both client_id and bearer defined';
}
if ( $config['clientId'] !== 'bbx_test_client' ) {
	$failures[] = "FAIL: expected clientId='bbx_test_client', got " . var_export( $config['clientId'], true );
}

if ( empty( $failures ) ) {
	echo "PASS: Bearer key never appears in blackbox_client_config() payload\n";
	echo "PASS: only allowlisted keys present (enrolled, clientId, apiHost)\n";
	exit( 0 );
}

foreach ( $failures as $f ) {
	echo $f . "\n";
}
exit( 1 );

/**
 * Polyfill for `wp_json_encode` so we don't have to bootstrap WordPress.
 *
 * @param mixed $data Anything JSON-encodable.
 * @return string
 */
function wp_json_encode_polyfill( $data ) {
	return json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
}
