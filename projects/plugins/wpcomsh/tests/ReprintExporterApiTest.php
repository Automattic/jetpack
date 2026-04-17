<?php
/**
 * Reprint Exporter API Test file.
 *
 * Verifies the reprint-exporter API endpoints (?reprint-api,
 * rotate-export-secret REST route) and their proxied-Automattician gating.
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
		delete_option( REPRINT_EXPORTER_SECRET_OPTION );

		// Drop any gate-override filters set by a test.
		remove_all_filters( 'wpcomsh_reprint_exporter_available' );

		// Reset the REST server so route registrations don't leak between tests.
		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	/**
	 * Helper: force the availability gate on or off.
	 *
	 * In production the gate returns true only for Automatticians proxying
	 * through the a8c proxy. Tests can't set that up, so we override the
	 * filter that the helper exposes.
	 *
	 * @param bool $available Whether the endpoints should be available.
	 */
	private function set_available( bool $available ) {
		remove_all_filters( 'wpcomsh_reprint_exporter_available' );
		add_filter(
			'wpcomsh_reprint_exporter_available',
			$available ? '__return_true' : '__return_false'
		);
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
	 * Test that the rest_api_init handler is registered.
	 */
	public function test_rest_api_init_handler_registered() {
		$this->assertNotFalse(
			has_action( 'rest_api_init', 'wpcomsh_reprint_rest_init' )
		);
	}

	/**
	 * Test that the request handler exits early when both query params are absent.
	 */
	public function test_handle_request_returns_early_without_query_param() {
		unset( $_GET['reprint-api'], $_GET['site-export-api'] );
		wpcomsh_reprint_handle_request();

		$this->assertFalse( get_option( REPRINT_EXPORTER_SECRET_OPTION, false ) );
	}

	/**
	 * Test that the request handler exits early when the gate is closed.
	 */
	public function test_handle_request_returns_early_when_gate_closed() {
		$_GET['reprint-api'] = '1';
		$this->set_available( false );

		wpcomsh_reprint_handle_request();

		$this->assertFalse( get_option( REPRINT_EXPORTER_SECRET_OPTION, false ) );

		unset( $_GET['reprint-api'] );
	}

	/**
	 * Test that the legacy ?site-export-api query parameter is still accepted.
	 */
	public function test_handle_request_accepts_legacy_query_param() {
		$_GET['site-export-api'] = '1';
		$this->set_available( false );

		// Gate is closed, so the handler must bail silently. The point of this
		// test is that it reaches the gate branch rather than the earlier
		// "no query param" branch — i.e. the legacy name is honored.
		wpcomsh_reprint_handle_request();

		$this->assertFalse( get_option( REPRINT_EXPORTER_SECRET_OPTION, false ) );

		unset( $_GET['site-export-api'] );
	}

	/**
	 * Test that neither REST route is registered when the gate is closed.
	 */
	public function test_rest_route_not_registered_when_gate_closed() {
		$this->set_available( false );

		$server = $this->fresh_rest_server();
		$routes = $server->get_routes();
		$this->assertArrayNotHasKey( '/wp/v2/reprint/rotate-export-secret', $routes );
		$this->assertArrayNotHasKey( '/wp/v2/streaming-export/rotate-secret', $routes );
	}

	/**
	 * Test that both REST routes are registered when the gate is open.
	 *
	 * The canonical route is /wp/v2/reprint/rotate-export-secret; the legacy
	 * /wp/v2/streaming-export/rotate-secret remains as a back-compat alias.
	 */
	public function test_rest_route_registered_when_gate_open() {
		$this->set_available( true );

		$server = $this->fresh_rest_server();
		$routes = $server->get_routes();
		$this->assertArrayHasKey( '/wp/v2/reprint/rotate-export-secret', $routes );
		$this->assertArrayHasKey( '/wp/v2/streaming-export/rotate-secret', $routes );
	}

	/**
	 * Test that the rotate-secret endpoint requires super-admin permissions.
	 */
	public function test_rotate_secret_requires_super_admin() {
		$this->set_available( true );

		$server = $this->fresh_rest_server();

		// Non-admin user.
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'POST', '/wp/v2/reprint/rotate-export-secret' );
		$response = $server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Test that the rotate-secret endpoint works for super admins.
	 */
	public function test_rotate_secret_works_for_super_admin() {
		$this->set_available( true );

		$server = $this->fresh_rest_server();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		grant_super_admin( $user_id );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'POST', '/wp/v2/reprint/rotate-export-secret' );
		$response = $server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'secret', $data );
		$this->assertSame( 64, strlen( $data['secret'] ), 'Secret should be 64 hex characters' );
	}

	/**
	 * Test that the legacy REST route also works for super admins.
	 */
	public function test_rotate_secret_legacy_route_still_works() {
		$this->set_available( true );

		$server = $this->fresh_rest_server();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		grant_super_admin( $user_id );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'POST', '/wp/v2/streaming-export/rotate-secret' );
		$response = $server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'secret', $data );
		$this->assertSame( 64, strlen( $data['secret'] ) );
	}

	/**
	 * Test that rotating the secret stores it in the site option.
	 */
	public function test_rotate_secret_stores_in_option() {
		$this->set_available( true );

		$server = $this->fresh_rest_server();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		grant_super_admin( $user_id );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'POST', '/wp/v2/reprint/rotate-export-secret' );
		$response = $server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'secret', $data );
		$stored = get_option( REPRINT_EXPORTER_SECRET_OPTION );
		$this->assertSame( $data['secret'], $stored );
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

	// -- Permission callback tests -------------------------------------------

	/**
	 * Test that the permission callback denies non-super-admin users.
	 */
	public function test_permission_callback_denies_non_admin() {
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$result = wpcomsh_reprint_permission_callback();
		$this->assertInstanceOf( 'WP_Error', $result );
	}

	/**
	 * Test that the permission callback allows super admins.
	 */
	public function test_permission_callback_allows_super_admin() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		grant_super_admin( $user_id );
		wp_set_current_user( $user_id );

		$this->assertTrue( wpcomsh_reprint_permission_callback() );
	}

	/**
	 * Test that the rotate-secret callback generates a 64-character hex secret.
	 */
	public function test_rotate_secret_callback_generates_valid_secret() {
		$response = wpcomsh_reprint_rotate_secret_callback();

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
		$response = wpcomsh_reprint_rotate_secret_callback();
		$data     = $response->get_data();

		$this->assertSame( $data['secret'], get_option( REPRINT_EXPORTER_SECRET_OPTION ) );
	}
}
