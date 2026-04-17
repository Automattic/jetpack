<?php
/**
 * Reprint Exporter API Test file.
 *
 * Verifies the reprint-exporter API endpoints (?reprint-api,
 * rotate-export-secret REST route) and their option + proxied-Automattician
 * gating.
 *
 * @package wpcomsh
 */

require_once __DIR__ . '/stubs/is-automattician.php';

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

		// Drop the per-test user_has_cap filter used by force_super_admin().
		remove_all_filters( 'user_has_cap' );

		// Reset the Automattician/proxy simulation set by set_available().
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		unset( $GLOBALS['__reprint_test_is_automattician'] );

		// Reset the REST server so route registrations don't leak between tests.
		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	/**
	 * Helper: make is_super_admin() return true for the current user.
	 *
	 * Note that grant_super_admin() only works on multisite, and the WP
	 * Cloud test site runs as single-site with administrator capabilities
	 * stripped — so the usual "administrator role ⇒ is_super_admin"
	 * shortcut doesn't apply. Grant the capability is_super_admin()
	 * actually checks on single-site (delete_users) via the user_has_cap
	 * filter instead.
	 */
	private function force_super_admin() {
		add_filter(
			'user_has_cap',
			function ( $allcaps ) {
				$allcaps['delete_users'] = true;
				return $allcaps;
			}
		);
	}

	/**
	 * Helper: satisfy (or not) the full availability gate.
	 *
	 * The gate requires BOTH the reprint_exporter_enabled site option AND
	 * a proxied-Automattician request. Flip the option directly, and
	 * simulate the proxied-Automattician part via the $_SERVER header plus
	 * the is_automattician() stub defined at the top of this file.
	 *
	 * @param bool $available Whether the endpoints should be available.
	 */
	private function set_available( bool $available ) {
		if ( $available ) {
			update_option( 'reprint_exporter_enabled', 1 );
			$_SERVER['A8C_PROXIED_REQUEST']             = '1';
			$GLOBALS['__reprint_test_is_automattician'] = true;
		} else {
			delete_option( 'reprint_exporter_enabled' );
			unset( $_SERVER['A8C_PROXIED_REQUEST'] );
			unset( $GLOBALS['__reprint_test_is_automattician'] );
		}
	}

	/**
	 * Skip the current test when the Automattician check can't be faked.
	 *
	 * Our is_automattician() stub only loads when the real function is
	 * absent. On WP Cloud (and any other WPCOM-flavored environment) the
	 * real is_automattician() is defined and rejects factory-created
	 * users, so there's no way to fake a proxied-Automattician request
	 * from inside the test.
	 */
	private function skip_if_cannot_fake_automattician() {
		$GLOBALS['__reprint_test_is_automattician'] = true;
		$faked                                      = is_automattician( get_current_user_id() );
		unset( $GLOBALS['__reprint_test_is_automattician'] );

		if ( ! $faked ) {
			$this->markTestSkipped( 'Cannot fake is_automattician() in this environment.' );
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
	 * Test that the template_redirect handler is registered.
	 */
	public function test_template_redirect_handler_registered() {
		$this->assertNotFalse(
			has_action( 'template_redirect', 'wpcomsh_reprint_handle_request' )
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
		unset( $_GET['reprint-api'] );
		wpcomsh_reprint_handle_request();

		$this->assertFalse( get_option( 'reprint_exporter_secret', false ) );
	}

	// The other handler-early-return branches (is_front_page() false,
	// availability gate closed) aren't unit-tested directly: reaching them
	// requires go_to(), and the WP Cloud test site is a Private Site whose
	// template_redirect hooks call exit(), which crashes the PHPUnit
	// process. The guards are simple if-return checks; CI covers their
	// effects via the "route not registered when gate closed" test.

	/**
	 * Test that the REST route is not registered when the gate is closed.
	 */
	public function test_rest_route_not_registered_when_gate_closed() {
		$this->set_available( false );

		$server = $this->fresh_rest_server();
		$routes = $server->get_routes();
		$this->assertArrayNotHasKey( '/wpcomsh/v1/reprint/rotate-export-secret', $routes );
	}

	/**
	 * Test that the REST route is registered when the gate is open.
	 */
	public function test_rest_route_registered_when_gate_open() {
		$this->skip_if_cannot_fake_automattician();
		$this->set_available( true );

		$server = $this->fresh_rest_server();
		$routes = $server->get_routes();
		$this->assertArrayHasKey( '/wpcomsh/v1/reprint/rotate-export-secret', $routes );
	}

	/**
	 * Test that the rotate-secret endpoint requires super-admin permissions.
	 */
	public function test_rotate_secret_requires_super_admin() {
		$this->skip_if_cannot_fake_automattician();
		$this->set_available( true );

		$server = $this->fresh_rest_server();

		// Non-admin user.
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'POST', '/wpcomsh/v1/reprint/rotate-export-secret' );
		$response = $server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	// The success path for the rotate-secret endpoint is covered by the
	// direct controller tests (test_permission_callback_allows_super_admin,
	// test_rotate_secret_callback_generates_valid_secret,
	// test_rotate_secret_callback_persists_secret). A full REST dispatch
	// test isn't added here because the WP Cloud test environment injects
	// a rest_authentication_errors filter that rejects non-proxied
	// requests with a 403, which can't be bypassed from test setUp.

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
	 * Test that the permission callback denies non-super-admin users.
	 */
	public function test_permission_callback_denies_non_admin() {
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$result = $this->controller()->permission_check();
		$this->assertInstanceOf( 'WP_Error', $result );
	}

	/**
	 * Test that the permission callback allows super admins.
	 */
	public function test_permission_callback_allows_super_admin() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->force_super_admin();

		$this->assertTrue( $this->controller()->permission_check() );
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
