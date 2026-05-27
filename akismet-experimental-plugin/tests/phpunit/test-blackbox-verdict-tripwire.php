<?php
/**
 * Guardrail tripwire: GUARDRAILS.md §"Tripwire tests" requires that the
 * Blackbox verdict handler serves a deterministic mock when
 * `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` is off — even when
 * `AKISMET_BLACKBOX_API_KEY` is defined.
 *
 * Plain-PHP test: same shape as test-blackbox-aggregates-tripwire.php.
 *
 *   php tests/phpunit/test-blackbox-verdict-tripwire.php
 *
 * Exits 0 on pass, 1 on fail.
 *
 * @package Akismet_Experimental
 */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ );
}

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

define( 'AKISMET_EXPERIMENTAL_UI', true );
define( 'AKISMET_BLACKBOX_API_KEY', 'SECRET_BEARER_DO_NOT_LEAK' );
define( 'AKISMET_BLACKBOX_CLIENT_ID', 'bbx_test_client' );

require_once dirname( __DIR__, 2 ) . '/class.akismet-experimental.php';
require_once dirname( __DIR__, 2 ) . '/class.akismet-experimental-rest-api.php';

$failures = array();

if ( Akismet_Experimental::allow_blackbox_api() ) {
	$failures[] = 'FAIL: ALLOW_BLACKBOX_API should be OFF for this tripwire';
}
$config = Akismet_Experimental::blackbox_client_config();
if ( true !== $config['enrolled'] ) {
	$failures[] = 'FAIL: expected enrolled=true with client_id + bearer defined';
}

$request  = new WP_REST_Request( array( 'session_id' => 'sess_test_abc' ) );
$response = Akismet_Experimental_REST_API::get_blackbox_verdict( $request );

if ( ! is_array( $response ) ) {
	$failures[] = 'FAIL: expected array response, got ' . gettype( $response );
} else {
	if ( true !== $response['preview'] ) {
		$failures[] = 'FAIL: expected preview=true on mock verdict, got ' . var_export( $response['preview'], true );
	}
	if ( 'sess_test_abc' !== $response['session_id'] ) {
		$failures[] = 'FAIL: expected session_id=sess_test_abc, got ' . var_export( $response['session_id'], true );
	}
	if ( ! in_array( $response['decision'], array( 'allow', 'challenge', 'block' ), true ) ) {
		$failures[] = "FAIL: unexpected decision '{$response['decision']}'";
	}
	if ( ! isset( $response['signals'] ) || ! is_array( $response['signals'] ) ) {
		$failures[] = 'FAIL: expected mock signals array';
	}
	$serialized = json_encode( $response );
	if ( false !== strpos( $serialized, 'SECRET_BEARER_DO_NOT_LEAK' ) ) {
		$failures[] = 'FAIL: Bearer key value appeared in serialized verdict response';
	}
}

if ( empty( $failures ) ) {
	echo "PASS: blackbox/verdict served deterministic mock with preview=true\n";
	echo "PASS: Bearer key value never appeared in serialized response\n";
	exit( 0 );
}

foreach ( $failures as $f ) {
	echo $f . "\n";
}
exit( 1 );
