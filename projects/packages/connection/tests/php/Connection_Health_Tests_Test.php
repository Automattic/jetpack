<?php
/**
 * Tests for the Connection_Health_Tests class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Connection_Health_Tests class.
 *
 * @covers \Automattic\Jetpack\Connection\Connection_Health_Tests
 */
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

	/**
	 * Test blog_token_if_exists skips when not connected.
	 */
	public function test_blog_token_if_exists_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__blog_token_if_exists' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test check_if_connected skips when no blog token.
	 */
	public function test_check_if_connected_skipped_when_no_token() {
		$result = $this->tests->run_test( 'test__check_if_connected' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test master_user_exists_on_site skips when not connected.
	 */
	public function test_master_user_exists_on_site_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__master_user_exists_on_site' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test master_user_can_manage_options skips when not connected.
	 */
	public function test_master_user_can_manage_options_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__master_user_can_manage_options' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test identity_crisis skips when not connected.
	 */
	public function test_identity_crisis_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__identity_crisis' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test wpcom_connection_test skips when not connected.
	 */
	public function test_wpcom_connection_test_skipped_when_not_connected() {
		$result = $this->tests->run_test( 'test__wpcom_connection_test' );
		$this->assertEquals( 'skipped', $result['pass'] );
	}

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
		unset( $_SERVER['SERVER_PORT'] );

		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test xml_parser_available passes (XML extension is always available in CI).
	 */
	public function test_xml_parser_available_passes() {
		$result = $this->tests->run_test( 'test__xml_parser_available' );
		$this->assertTrue( $result['pass'] );
	}

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
		remove_all_filters( 'pre_http_request' );

		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test outbound_http fails when request fails.
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
		remove_all_filters( 'pre_http_request' );

		$this->assertFalse( $result['pass'] );
	}

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
		remove_all_filters( 'pre_http_request' );

		$this->assertTrue( $result['pass'] );
	}

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

		new Connection_Health_Tests();
		remove_all_actions( 'jetpack_connection_tests_loaded' );

		$this->assertTrue( $fired );
	}
}
