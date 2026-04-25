<?php
/**
 * Reprint Exporter API Test file.
 *
 * @package wpcomsh
 */

/**
 * Class ReprintExporterApiTest.
 */
class ReprintExporterApiTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( 'reprint_exporter_secret' );
		delete_option( 'reprint_exporter_enabled' );

		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	/**
	 * Helper: open or close the ?reprint-api gate.
	 *
	 * @param bool $available Whether the export endpoint should be reachable.
	 */
	private function set_available( bool $available ) {
		if ( $available ) {
			update_option( 'reprint_exporter_enabled', time() );
		} else {
			delete_option( 'reprint_exporter_enabled' );
		}
	}

	/**
	 * Helper: get a fresh REST server with routes re-registered.
	 *
	 * @return WP_REST_Server
	 */
	private function fresh_rest_server() {
		global $wp_rest_server;
		$wp_rest_server = null;
		return rest_get_server();
	}

	/**
	 * Test that the parse_request handler is registered.
	 */
	public function test_parse_request_handler_registered() {
		$this->assertSame(
			0,
			has_action( 'parse_request', 'wpcomsh_reprint_handle_request' )
		);
	}

	/**
	 * Helper: build a WP instance with its ->request populated.
	 *
	 * In production, parse_request normalizes the requested path into
	 * $wp->request; in tests we just set it directly.
	 *
	 * @param string $request Normalized request path ('' for site root).
	 * @return WP
	 */
	private function wp_with_request( string $request ): WP {
		$wp          = new WP();
		$wp->request = $request;
		return $wp;
	}

	/**
	 * Test that the rest_api_init handler is registered.
	 */
	public function test_rest_api_init_handler_registered() {
		$this->assertNotFalse(
			has_action( 'rest_api_init', 'wpcomsh_reprint_rest_init' )
		);
	}

	/**
	 * Test that the request handler exits early when the query param is absent.
	 */
	public function test_handle_request_returns_early_without_query_param() {
		unset( $_GET['reprint-api'] );
		wpcomsh_reprint_handle_request( $this->wp_with_request( '' ) );

		$this->assertFalse( get_option( 'reprint_exporter_secret', false ) );
	}

	/**
	 * Test that the request handler exits early on non-root URLs.
	 */
	public function test_handle_request_returns_early_when_not_home_url() {
		$_GET['reprint-api'] = '1';

		wpcomsh_reprint_handle_request( $this->wp_with_request( 'some/post' ) );

		$this->assertFalse( get_option( 'reprint_exporter_secret', false ) );

		unset( $_GET['reprint-api'] );
	}

	/**
	 * Test that the request handler exits early when the gate is closed.
	 */
	public function test_handle_request_returns_early_when_gate_closed() {
		$_GET['reprint-api'] = '1';
		$this->set_available( false );

		wpcomsh_reprint_handle_request( $this->wp_with_request( '' ) );

		$this->assertFalse( get_option( 'reprint_exporter_secret', false ) );

		unset( $_GET['reprint-api'] );
	}

	/**
	 * Test that the rotate-secret route is always registered.
	 */
	public function test_rest_route_always_registered() {
		$server = $this->fresh_rest_server();
		$routes = $server->get_routes();
		$this->assertArrayHasKey( '/wpcomsh/v1/reprint/rotate-export-secret', $routes );
	}

	/**
	 * Test that the rotate-secret endpoint rejects unsigned requests.
	 */
	public function test_rotate_secret_rejects_unsigned_requests() {
		$server   = $this->fresh_rest_server();
		$request  = new WP_REST_Request( 'POST', '/wpcomsh/v1/reprint/rotate-export-secret' );
		$response = $server->dispatch( $request );

		$this->assertContains( $response->get_status(), array( 401, 403 ) );
	}

	/**
	 * Test that both site-settings filters are hooked.
	 */
	public function test_settings_filters_are_registered() {
		$this->assertNotFalse(
			has_filter( 'rest_api_update_site_settings', 'wpcomsh_reprint_inject_enabled_setting' )
		);
		$this->assertNotFalse(
			has_filter( 'site_settings_endpoint_update_reprint_exporter_enabled', 'wpcomsh_reprint_update_enabled_setting' )
		);
	}

	/**
	 * Test that the inject filter copies the key from unfiltered input.
	 */
	public function test_settings_inject_adds_key_from_unfiltered() {
		$input  = array( 'blogname' => 'Test' );
		$raw    = array(
			'blogname'                 => 'Test',
			'reprint_exporter_enabled' => '1745000000',
		);
		$result = wpcomsh_reprint_inject_enabled_setting( $input, $raw );

		$this->assertSame( 1745000000, $result['reprint_exporter_enabled'] );
		$this->assertSame( 'Test', $result['blogname'] );
	}

	/**
	 * Test that the inject filter is a no-op when the key is absent.
	 */
	public function test_settings_inject_noop_when_absent() {
		$input  = array( 'blogname' => 'Test' );
		$raw    = array( 'blogname' => 'Test' );
		$result = wpcomsh_reprint_inject_enabled_setting( $input, $raw );

		$this->assertArrayNotHasKey( 'reprint_exporter_enabled', $result );
	}

	// -- HMAC verification tests (Site_Export_HMAC_Server) --------------------

	/**
	 * Helper: build HMAC auth headers for a given secret and body.
	 *
	 * @param string $secret Shared secret.
	 * @param string $body   Request body.
	 * @return array Headers as name => value.
	 */
	private function make_hmac_headers( string $secret, string $body = '' ): array {
		$nonce        = bin2hex( random_bytes( 16 ) );
		$timestamp    = (string) microtime( true );
		$content_hash = hash( 'sha256', $body );
		$signature    = hash_hmac( 'sha256', $nonce . $timestamp . $content_hash, $secret );

		return array(
			'X-Auth-Signature'    => $signature,
			'X-Auth-Nonce'        => $nonce,
			'X-Auth-Timestamp'    => $timestamp,
			'X-Auth-Content-Hash' => $content_hash,
		);
	}

	/**
	 * Test that HMAC verification succeeds with valid headers and empty body.
	 */
	public function test_verify_hmac_succeeds_with_valid_signature() {
		$secret  = 'test_secret_for_hmac';
		$server  = new Site_Export_HMAC_Server( $secret );
		$headers = $this->make_hmac_headers( $secret );

		$this->assertNull( $server->verify( $headers, '' ) );
	}

	/**
	 * Test that HMAC verification fails when signature header is missing.
	 */
	public function test_verify_hmac_fails_without_signature() {
		$server  = new Site_Export_HMAC_Server( 'secret' );
		$headers = $this->make_hmac_headers( 'secret' );
		unset( $headers['X-Auth-Signature'] );

		$result = $server->verify( $headers, '' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'Missing X-Auth-Signature', $result );
	}

	/**
	 * Test that HMAC verification fails when nonce header is missing.
	 */
	public function test_verify_hmac_fails_without_nonce() {
		$server  = new Site_Export_HMAC_Server( 'secret' );
		$headers = $this->make_hmac_headers( 'secret' );
		unset( $headers['X-Auth-Nonce'] );

		$result = $server->verify( $headers, '' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'Missing X-Auth-Nonce', $result );
	}

	/**
	 * Test that HMAC verification fails when timestamp header is missing.
	 */
	public function test_verify_hmac_fails_without_timestamp() {
		$server  = new Site_Export_HMAC_Server( 'secret' );
		$headers = $this->make_hmac_headers( 'secret' );
		unset( $headers['X-Auth-Timestamp'] );

		$result = $server->verify( $headers, '' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'Missing X-Auth-Timestamp', $result );
	}

	/**
	 * Test that HMAC verification fails when content hash header is missing.
	 */
	public function test_verify_hmac_fails_without_content_hash() {
		$server  = new Site_Export_HMAC_Server( 'secret' );
		$headers = $this->make_hmac_headers( 'secret' );
		unset( $headers['X-Auth-Content-Hash'] );

		$result = $server->verify( $headers, '' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'Missing X-Auth-Content-Hash', $result );
	}

	/**
	 * Test that HMAC verification fails with non-numeric timestamp.
	 */
	public function test_verify_hmac_fails_with_invalid_timestamp() {
		$server = new Site_Export_HMAC_Server( 'secret' );

		$headers                     = $this->make_hmac_headers( 'secret' );
		$headers['X-Auth-Timestamp'] = 'not-a-number';

		$result = $server->verify( $headers, '' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'Invalid timestamp', $result );
	}

	/**
	 * Test that HMAC verification fails with expired timestamp.
	 */
	public function test_verify_hmac_fails_with_expired_timestamp() {
		$secret       = 'test_secret';
		$server       = new Site_Export_HMAC_Server( $secret );
		$nonce        = bin2hex( random_bytes( 16 ) );
		$timestamp    = (string) ( microtime( true ) - 500 );
		$content_hash = hash( 'sha256', '' );
		$signature    = hash_hmac( 'sha256', $nonce . $timestamp . $content_hash, $secret );

		$headers = array(
			'X-Auth-Signature'    => $signature,
			'X-Auth-Nonce'        => $nonce,
			'X-Auth-Timestamp'    => $timestamp,
			'X-Auth-Content-Hash' => $content_hash,
		);

		$result = $server->verify( $headers, '' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'Request timestamp expired', $result );
	}

	/**
	 * Test that HMAC verification fails with too-short nonce.
	 */
	public function test_verify_hmac_fails_with_short_nonce() {
		$secret       = 'test_secret';
		$server       = new Site_Export_HMAC_Server( $secret );
		$nonce        = 'short';
		$timestamp    = (string) microtime( true );
		$content_hash = hash( 'sha256', '' );
		$signature    = hash_hmac( 'sha256', $nonce . $timestamp . $content_hash, $secret );

		$headers = array(
			'X-Auth-Signature'    => $signature,
			'X-Auth-Nonce'        => $nonce,
			'X-Auth-Timestamp'    => $timestamp,
			'X-Auth-Content-Hash' => $content_hash,
		);

		$result = $server->verify( $headers, '' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'Nonce must be at least 16 characters', $result );
	}

	/**
	 * Test that HMAC verification fails with wrong secret.
	 */
	public function test_verify_hmac_fails_with_wrong_secret() {
		$server  = new Site_Export_HMAC_Server( 'wrong_secret' );
		$headers = $this->make_hmac_headers( 'correct_secret' );

		$result = $server->verify( $headers, '' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'HMAC signature verification failed', $result );
	}

	/**
	 * Test that HMAC verification fails when content hash doesn't match body.
	 */
	public function test_verify_hmac_fails_with_content_hash_mismatch() {
		$secret  = 'test_secret';
		$server  = new Site_Export_HMAC_Server( $secret );
		$headers = $this->make_hmac_headers( $secret, 'original body' );

		$result = $server->verify( $headers, 'tampered body' );
		$this->assertNotNull( $result );
		$this->assertStringContainsString( 'Content hash mismatch', $result );
	}

	// -- Controller tests ----------------------------------------------------

	/**
	 * Helper: get a Reprint_Exporter_Rest_Controller instance.
	 *
	 * @return Reprint_Exporter_Rest_Controller
	 */
	private function controller(): Reprint_Exporter_Rest_Controller {
		require_once dirname( __DIR__ ) . '/feature-plugins/class-reprint-exporter-rest-controller.php';
		return new Reprint_Exporter_Rest_Controller();
	}

	/**
	 * Test that the permission callback denies unsigned requests.
	 */
	public function test_permission_callback_denies_unsigned_request() {
		$this->assertFalse( $this->controller()->permission_check() );
	}

	/**
	 * Test that the rotate-secret callback generates a 64-character hex secret.
	 */
	public function test_rotate_secret_callback_generates_valid_secret() {
		$response = $this->controller()->rotate_secret();

		$this->assertInstanceOf( 'WP_REST_Response', $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'secret', $data );
		$this->assertSame( 64, strlen( $data['secret'] ) );
		$this->assertMatchesRegularExpression( '/^[0-9a-f]{64}$/', $data['secret'] );
	}

	/**
	 * Test that the rotate-secret callback stores the secret in the option.
	 */
	public function test_rotate_secret_callback_persists_secret() {
		$response = $this->controller()->rotate_secret();
		$data     = $response->get_data();

		$this->assertSame( $data['secret'], get_option( 'reprint_exporter_secret' ) );
	}
}
