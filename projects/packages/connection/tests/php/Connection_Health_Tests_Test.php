<?php
/**
 * Tests for the Connection_Health_Tests class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for the Connection_Health_Tests class.
 *
 * @covers \Automattic\Jetpack\Connection\Connection_Health_Tests
 */
#[AllowMockObjectsWithoutExpectations /* Mocks created via create_mock_with_helpers() configure return values but not expectations. */]
#[CoversClass( Connection_Health_Tests::class )]
class Connection_Health_Tests_Test extends TestCase {

	/**
	 * Test instance.
	 *
	 * @var Connection_Health_Tests
	 */
	private $tests;

	/**
	 * Set up test fixtures.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->tests = new Connection_Health_Tests();
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();
		( new Manager() )->reset_connection_status();
		StatusCache::clear();
		unset( $_SERVER['SERVER_PORT'], $_SERVER['HTTP_X_FORWARDED_PORT'], $_SERVER['HTTPS'] );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_filters( 'jetpack_debugger_run_self_test' );
		remove_all_filters( 'jetpack_connection_reconnect_url' );
		remove_all_filters( 'jetpack_connection_support_url' );
		remove_all_actions( 'jetpack_connection_tests_loaded' );
	}

	/**
	 * Create a partial mock of Connection_Health_Tests with helper methods overridden.
	 *
	 * @param array $overrides Map of method name => return value.
	 * @return Connection_Health_Tests
	 */
	private function create_mock_with_helpers( $overrides ) {
		$mock = $this->getMockBuilder( Connection_Health_Tests::class )
			->onlyMethods( array_keys( $overrides ) )
			->getMock();

		foreach ( $overrides as $method => $return ) {
			$mock->method( $method )->willReturn( $return );
		}

		return $mock;
	}

	/**
	 * Test that the constructor auto-discovers test methods.
	 */
	public function test_constructor_discovers_tests() {
		$tests = $this->tests->list_tests();

		$this->assertArrayHasKey( 'test__blog_token_if_exists', $tests );
		$this->assertArrayHasKey( 'test__check_if_connected', $tests );
		$this->assertArrayHasKey( 'test__master_user_exists_on_site', $tests );
		$this->assertArrayHasKey( 'test__master_user_can_manage_options', $tests );
		$this->assertArrayHasKey( 'test__outbound_http', $tests );
		$this->assertArrayHasKey( 'test__outbound_https', $tests );
		$this->assertArrayHasKey( 'test__identity_crisis', $tests );
		$this->assertArrayHasKey( 'test__connection_token_health', $tests );
		$this->assertArrayHasKey( 'test__wpcom_connection_test', $tests );
		$this->assertArrayHasKey( 'test__server_port_value', $tests );
		$this->assertArrayHasKey( 'test__xml_parser_available', $tests );
	}

	/**
	 * Test that all discovered tests are registered as 'direct' type.
	 */
	public function test_all_tests_are_direct() {
		foreach ( $this->tests->list_tests() as $test ) {
			$this->assertEquals( 'direct', $test['type'], "Test {$test['name']} should be 'direct' type." );
		}
	}

	/**
	 * Test that last__wpcom_self_test is not included by default.
	 */
	public function test_wpcom_self_test_not_included_by_default() {
		$tests = $this->tests->list_tests();
		$this->assertArrayNotHasKey( 'test__wpcom_self_test', $tests );
	}

	/**
	 * Test that last__wpcom_self_test is included when filter returns true.
	 */
	public function test_wpcom_self_test_included_when_filter_enabled() {
		add_filter( 'jetpack_debugger_run_self_test', '__return_true' );
		$tests = new Connection_Health_Tests();
		remove_filter( 'jetpack_debugger_run_self_test', '__return_true' );

		$this->assertArrayHasKey( 'test__wpcom_self_test', $tests->list_tests() );
	}

	// -------------------------------------------------------------------------
	// test__blog_token_if_exists
	// -------------------------------------------------------------------------

	/**
	 * Test blog_token_if_exists skips when not connected.
	 */
	public function test_blog_token_if_exists_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__blog_token_if_exists' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test blog_token_if_exists passes when connected and token exists.
	 */
	public function test_blog_token_if_exists_passes_when_token_exists() {
		$mock = $this->create_mock_with_helpers(
			array(
				'helper_is_connected'   => true,
				'helper_get_blog_token' => (object) array( 'secret' => 'test.token' ),
			)
		);

		$result = $mock->run_test( 'test__blog_token_if_exists' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test blog_token_if_exists fails when connected but token is missing.
	 */
	public function test_blog_token_if_exists_fails_when_token_missing() {
		$mock = $this->create_mock_with_helpers(
			array(
				'helper_is_connected'   => true,
				'helper_get_blog_token' => false,
			)
		);

		$result = $mock->run_test( 'test__blog_token_if_exists' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__check_if_connected
	// -------------------------------------------------------------------------

	/**
	 * Test check_if_connected skips when no blog token.
	 */
	public function test_check_if_connected_skipped_when_no_token() {
		$result = $this->tests->run_test( 'test__check_if_connected' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test check_if_connected passes when connected.
	 */
	public function test_check_if_connected_passes_when_connected() {
		$mock = $this->create_mock_with_helpers(
			array(
				'helper_get_blog_token' => (object) array( 'secret' => 'test.token' ),
				'helper_is_connected'   => true,
			)
		);

		$result = $mock->run_test( 'test__check_if_connected' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test check_if_connected skips in offline mode.
	 */
	public function test_check_if_connected_skipped_in_offline_mode() {
		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$mock = $this->create_mock_with_helpers(
			array(
				'helper_get_blog_token' => (object) array( 'secret' => 'test.token' ),
				'helper_is_connected'   => false,
			)
		);

		$result = $mock->run_test( 'test__check_if_connected' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test check_if_connected fails when not connected and not offline.
	 */
	public function test_check_if_connected_fails_when_not_connected() {
		$mock = $this->create_mock_with_helpers(
			array(
				'helper_get_blog_token' => (object) array( 'secret' => 'test.token' ),
				'helper_is_connected'   => false,
			)
		);

		$result = $mock->run_test( 'test__check_if_connected' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__master_user_exists_on_site
	// -------------------------------------------------------------------------

	/**
	 * Test master_user_exists_on_site skips when not connected.
	 */
	public function test_master_user_exists_on_site_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__master_user_exists_on_site' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test master_user_exists_on_site skips when no connection owner.
	 */
	public function test_master_user_exists_on_site_skipped_when_no_owner() {
		$mock = $this->create_mock_with_helpers(
			array( 'helper_is_connected' => true )
		);

		$result = $mock->run_test( 'test__master_user_exists_on_site' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test master_user_exists_on_site passes when owner exists.
	 */
	public function test_master_user_exists_on_site_passes_when_owner_exists() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_owner',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );

		$mock = $this->create_mock_with_helpers(
			array( 'helper_is_connected' => true )
		);

		$result = $mock->run_test( 'test__master_user_exists_on_site' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test master_user_exists_on_site fails when owner does not exist on site.
	 */
	public function test_master_user_exists_on_site_fails_when_owner_missing() {
		// Force Manager to think user 99999 is the connection owner via memoization,
		// bypassing its validation that the user actually exists in the DB.
		$reflection = new \ReflectionClass( Manager::class );
		$property   = $reflection->getProperty( 'connection_owner_id' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, 99999 );

		$mock = $this->create_mock_with_helpers(
			array( 'helper_is_connected' => true )
		);

		$result = $mock->run_test( 'test__master_user_exists_on_site' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__master_user_can_manage_options
	// -------------------------------------------------------------------------

	/**
	 * Test master_user_can_manage_options skips when not connected.
	 */
	public function test_master_user_can_manage_options_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__master_user_can_manage_options' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test master_user_can_manage_options passes when owner is an administrator.
	 */
	public function test_master_user_can_manage_options_passes_when_admin() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );

		$mock = $this->create_mock_with_helpers(
			array( 'helper_is_connected' => true )
		);

		$result = $mock->run_test( 'test__master_user_can_manage_options' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test master_user_can_manage_options fails when owner is not an administrator.
	 */
	public function test_master_user_can_manage_options_fails_when_not_admin() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );

		$mock = $this->create_mock_with_helpers(
			array( 'helper_is_connected' => true )
		);

		$result = $mock->run_test( 'test__master_user_can_manage_options' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__outbound_http
	// -------------------------------------------------------------------------

	/**
	 * Test outbound_http passes with mocked successful response.
	 */
	public function test_outbound_http_passes_on_success() {
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => 'OK',
				);
			}
		);

		$result = $this->tests->run_test( 'test__outbound_http' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test outbound_http fails when request returns an error code.
	 */
	public function test_outbound_http_fails_on_error() {
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array( 'code' => 500 ),
					'body'     => 'Error',
				);
			}
		);

		$result = $this->tests->run_test( 'test__outbound_http' );
		$this->assertFalse( $result['pass'] );
	}

	/**
	 * Test outbound_http fails when request returns a WP_Error.
	 */
	public function test_outbound_http_fails_on_wp_error() {
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_failed', 'Connection refused' );
			}
		);

		$result = $this->tests->run_test( 'test__outbound_http' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__outbound_https
	// -------------------------------------------------------------------------

	/**
	 * Test outbound_https passes with mocked successful response.
	 */
	public function test_outbound_https_passes_on_success() {
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => 'OK',
				);
			}
		);

		$result = $this->tests->run_test( 'test__outbound_https' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test outbound_https fails when request returns an error code.
	 */
	public function test_outbound_https_fails_on_error() {
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array( 'code' => 500 ),
					'body'     => 'Error',
				);
			}
		);

		$result = $this->tests->run_test( 'test__outbound_https' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__identity_crisis
	// -------------------------------------------------------------------------

	/**
	 * Test identity_crisis skips when not connected.
	 */
	public function test_identity_crisis_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__identity_crisis' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test identity_crisis passes when no identity crisis is detected.
	 */
	public function test_identity_crisis_passes_when_no_idc() {
		$mock = $this->create_mock_with_helpers(
			array(
				'helper_is_connected'   => true,
				'check_identity_crisis' => false,
			)
		);

		$result = $mock->run_test( 'test__identity_crisis' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test identity_crisis fails when a URL mismatch is detected.
	 */
	public function test_identity_crisis_fails_with_url_mismatch() {
		$mock = $this->create_mock_with_helpers(
			array(
				'helper_is_connected'   => true,
				'check_identity_crisis' => array(
					'home'       => 'http://example.com',
					'wpcom_home' => 'http://different.com',
				),
			)
		);

		$result = $mock->run_test( 'test__identity_crisis' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__connection_token_health
	// -------------------------------------------------------------------------

	/**
	 * Test connection_token_health passes via blog token validation.
	 */
	public function test_connection_token_health_passes_with_valid_blog_token() {
		$mock = $this->create_mock_with_helpers(
			array(
				'check_blog_token_health' => Connection_Health_Test_Base::passing_test( array( 'name' => 'test__connection_token_health' ) ),
			)
		);

		$result = $mock->run_test( 'test__connection_token_health' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test connection_token_health fails when blog token validation fails.
	 */
	public function test_connection_token_health_fails_with_invalid_blog_token() {
		$mock = $this->create_mock_with_helpers(
			array(
				'check_blog_token_health' => Connection_Health_Test_Base::connection_failing_test( 'test__connection_token_health', 'Invalid token' ),
			)
		);

		$result = $mock->run_test( 'test__connection_token_health' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__wpcom_connection_test
	// -------------------------------------------------------------------------

	/**
	 * Test wpcom_connection_test skips when not connected.
	 */
	public function test_wpcom_connection_test_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__wpcom_connection_test' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Evaluate a decoded WP.com test-connection response via the protected helper.
	 *
	 * Avoids performing a signed remote request, which can't be mocked in a unit test.
	 *
	 * @param array      $response_body Decoded response body.
	 * @param int|string $status_code   HTTP status code of the WP.com response.
	 * @return array Test result.
	 */
	private function evaluate_response( array $response_body, $status_code = 200 ) {
		return $this->tests->evaluate_wpcom_connection_result( 'test__wpcom_connection_test', (object) $response_body, $status_code );
	}

	/**
	 * Test wpcom_connection_test passes when WP.com reports the site as connected.
	 */
	public function test_wpcom_connection_test_passes_when_connected() {
		$result = $this->evaluate_response( array( 'connected' => true ) );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test wpcom_connection_test does not offer a reconnect when the site itself
	 * is blocking WordPress.com (error_code = xmlrpc_request_blocked).
	 */
	public function test_wpcom_connection_test_blocked_does_not_offer_reconnect() {
		add_filter(
			'jetpack_connection_reconnect_url',
			static function () {
				return 'https://example.com/reconnect';
			}
		);
		add_filter(
			'jetpack_connection_support_url',
			static function () {
				return 'https://example.com/support';
			}
		);

		$result = $this->evaluate_response(
			array(
				'connected'        => false,
				'message'          => 'XML-RPC request was blocked.',
				'error_code'       => 'xmlrpc_request_blocked',
				'site_http_status' => 403,
			)
		);

		$this->assertFalse( $result['pass'] );
		$this->assertStringContainsString( '403', $result['short_description'] );
		// The action points to support, not the reconnect URL.
		$this->assertSame( 'https://example.com/support', $result['action'] );
		$this->assertNotSame( 'https://example.com/reconnect', $result['action'] );
	}

	/**
	 * Test the blocked-request result omits the HTTP status when it is unknown.
	 */
	public function test_wpcom_connection_test_blocked_without_status_code() {
		$result = $this->evaluate_response(
			array(
				'connected'  => false,
				'message'    => 'XML-RPC request was blocked.',
				'error_code' => 'xmlrpc_request_blocked',
			)
		);

		$this->assertFalse( $result['pass'] );
		$this->assertStringContainsString( 'blocked', $result['short_description'] );
	}

	/**
	 * Test wpcom_connection_test still offers a reconnect when the connection itself
	 * is invalid (no blocking error_code present).
	 */
	public function test_wpcom_connection_test_offers_reconnect_when_connection_invalid() {
		add_filter(
			'jetpack_connection_reconnect_url',
			static function () {
				return 'https://example.com/reconnect';
			}
		);

		$result = $this->evaluate_response(
			array(
				'connected' => false,
				'message'   => 'Invalid token.',
			)
		);

		$this->assertFalse( $result['pass'] );
		$this->assertSame( 'https://example.com/reconnect', $result['action'] );
		// WP.com's message is preserved and the status code is appended in a labeled form.
		$this->assertStringContainsString( 'Invalid token.', $result['short_description'] );
		$this->assertStringContainsString( '(status code: 200)', $result['short_description'] );
	}

	/**
	 * Test wpcom_connection_test produces a readable message when WP.com returns
	 * no message alongside a non-connected response.
	 */
	public function test_wpcom_connection_test_handles_missing_message() {
		$result = $this->evaluate_response( array( 'connected' => false ), 500 );

		$this->assertFalse( $result['pass'] );
		// The message should not start with a stray colon when no message is present.
		$this->assertStringStartsNotWith( ':', $result['short_description'] );
		$this->assertStringContainsString( '(status code: 500)', $result['short_description'] );
	}

	// -------------------------------------------------------------------------
	// test__server_port_value
	// -------------------------------------------------------------------------

	/**
	 * Test server_port_value skips when no server port is set (CLI).
	 */
	public function test_server_port_value_skipped_in_cli() {
		unset( $_SERVER['HTTP_X_FORWARDED_PORT'], $_SERVER['SERVER_PORT'] );
		$result = $this->tests->run_test( 'test__server_port_value' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test server_port_value passes on standard HTTP port.
	 */
	public function test_server_port_value_passes_on_port_80() {
		$_SERVER['SERVER_PORT'] = 80;
		$result                 = $this->tests->run_test( 'test__server_port_value' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test server_port_value passes on HTTPS port 443.
	 */
	public function test_server_port_value_passes_on_port_443() {
		$_SERVER['SERVER_PORT'] = 443;
		$_SERVER['HTTPS']       = 'on';
		$result                 = $this->tests->run_test( 'test__server_port_value' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test server_port_value fails on unexpected port.
	 */
	public function test_server_port_value_fails_on_unexpected_port() {
		$_SERVER['SERVER_PORT'] = 8443;
		$result                 = $this->tests->run_test( 'test__server_port_value' );
		$this->assertFalse( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// test__xml_parser_available
	// -------------------------------------------------------------------------

	/**
	 * Test xml_parser_available passes (XML extension is always available in CI).
	 */
	public function test_xml_parser_available_passes() {
		$result = $this->tests->run_test( 'test__xml_parser_available' );
		$this->assertTrue( $result['pass'] );
	}

	// -------------------------------------------------------------------------
	// Action hook
	// -------------------------------------------------------------------------

	/**
	 * Test that the jetpack_connection_tests_loaded action fires.
	 */
	public function test_action_fires_on_construction() {
		$fired = false;
		add_action(
			'jetpack_connection_tests_loaded',
			function () use ( &$fired ) {
				$fired = true;
			}
		);

		// @phan-suppress-next-line PhanNoopNew -- Constructor fires the action we're testing.
		new Connection_Health_Tests();

		$this->assertTrue( $fired );
	}
}
