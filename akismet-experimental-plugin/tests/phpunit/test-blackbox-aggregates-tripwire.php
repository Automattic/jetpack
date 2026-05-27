<?php
/**
 * Guardrail tripwire: GUARDRAILS.md §"Tripwire tests" requires that the
 * Blackbox aggregates handler serves the deterministic mock when
 * `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` is off — even when
 * `AKISMET_BLACKBOX_API_KEY` is defined.
 *
 * Plain-PHP test: runs from CLI without WP_UnitTestCase. Stubs the WP
 * functions needed by the REST class and invokes the handler directly.
 *
 *   php tests/phpunit/test-blackbox-aggregates-tripwire.php
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
	function current_user_can() { return true; } // phpcs:ignore
}
if ( ! function_exists( 'rest_authorization_required_code' ) ) {
	function rest_authorization_required_code() { return 401; } // phpcs:ignore
}
if ( ! function_exists( 'rest_ensure_response' ) ) {
	function rest_ensure_response( $data ) { return $data; } // phpcs:ignore
}
if ( ! function_exists( '__' ) ) {
	function __( $s ) { return $s; } // phpcs:ignore
}
if ( ! function_exists( 'esc_url_raw' ) ) {
	function esc_url_raw( $s ) { return $s; } // phpcs:ignore
}
if ( ! function_exists( 'register_rest_route' ) ) {
	function register_rest_route() {} // phpcs:ignore
}
if ( ! function_exists( 'is_wp_error' ) ) {
	function is_wp_error( $thing ) { return $thing instanceof WP_Error; } // phpcs:ignore
}
if ( ! function_exists( 'wp_remote_get' ) ) {
	function wp_remote_get() { return array(); } // phpcs:ignore
}
if ( ! function_exists( 'wp_remote_retrieve_response_code' ) ) {
	function wp_remote_retrieve_response_code() { return 200; } // phpcs:ignore
}
if ( ! function_exists( 'wp_remote_retrieve_body' ) ) {
	function wp_remote_retrieve_body() { return ''; } // phpcs:ignore
}

// Minimal stand-ins so the REST handler's type-hint resolves.
if ( ! class_exists( 'WP_REST_Server' ) ) {
	class WP_REST_Server { // phpcs:ignore
		const READABLE  = 'GET';
		const CREATABLE = 'POST';
		const EDITABLE  = 'PUT';
		const DELETABLE = 'DELETE';
	}
}
if ( ! class_exists( 'WP_Error' ) ) {
	class WP_Error { // phpcs:ignore
		public $code;
		public $message;
		public $data;
		public function __construct( $code = '', $message = '', $data = array() ) {
			$this->code    = $code;
			$this->message = $message;
			$this->data    = $data;
		}
	}
}
if ( ! class_exists( 'WP_REST_Request' ) ) {
	class WP_REST_Request { // phpcs:ignore
		private $params;
		public function __construct( $params = array() ) {
			$this->params = $params;
		}
		public function get_param( $key ) {
			return isset( $this->params[ $key ] ) ? $this->params[ $key ] : null;
		}
	}
}

// Define the guardrail constants to demonstrate the tripwire. Bearer key
// IS present + client id IS present (would normally enroll the site), but
// `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` is intentionally NOT defined.
define( 'AKISMET_EXPERIMENTAL_UI', true );
define( 'AKISMET_BLACKBOX_API_KEY', 'SECRET_BEARER_DO_NOT_LEAK' );
define( 'AKISMET_BLACKBOX_CLIENT_ID', 'bbx_test_client' );

require_once dirname( __DIR__, 2 ) . '/class.akismet-experimental.php';
require_once dirname( __DIR__, 2 ) . '/class.akismet-experimental-rest-api.php';

$failures = array();

// Sanity: ALLOW_BLACKBOX_API is OFF as expected.
if ( Akismet_Experimental::allow_blackbox_api() ) {
	$failures[] = 'FAIL: ALLOW_BLACKBOX_API should be OFF for this tripwire';
}

// Sanity: site looks enrolled (so the "not enrolled" branch isn't masking
// what we want to verify here).
$config = Akismet_Experimental::blackbox_client_config();
if ( true !== $config['enrolled'] ) {
	$failures[] = 'FAIL: expected enrolled=true with both client_id + bearer defined';
}

// Invoke the handler. Should short-circuit to the deterministic mock.
$request  = new WP_REST_Request(
	array(
		'category' => 'logins',
		'interval' => '30-days',
	)
);
$response = Akismet_Experimental_REST_API::get_blackbox_aggregates( $request );

if ( ! is_array( $response ) ) {
	$failures[] = 'FAIL: expected array response, got ' . gettype( $response );
} else {
	if ( true !== $response['preview'] ) {
		$failures[] = 'FAIL: expected preview=true on mock response, got ' . var_export( $response['preview'], true );
	}
	if ( 'logins' !== $response['category'] ) {
		$failures[] = 'FAIL: expected category=logins, got ' . var_export( $response['category'], true );
	}
	if ( ! isset( $response['series'] ) || ! is_array( $response['series'] ) ) {
		$failures[] = 'FAIL: expected mock series array';
	}

	// Confirm the Bearer value itself isn't anywhere in the serialized response.
	$serialized = json_encode( $response );
	if ( false !== strpos( $serialized, 'SECRET_BEARER_DO_NOT_LEAK' ) ) {
		$failures[] = 'FAIL: Bearer key value appeared in serialized aggregates response';
	}
}

if ( empty( $failures ) ) {
	echo "PASS: blackbox/aggregates served deterministic mock with preview=true\n";
	echo "PASS: Bearer key value never appeared in serialized response\n";
	exit( 0 );
}

foreach ( $failures as $f ) {
	echo $f . "\n";
}
exit( 1 );
