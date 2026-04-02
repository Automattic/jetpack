<?php
/**
 * Tests for the Connection_Health_Test_Base class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Connection_Health_Test_Base class.
 *
 * @covers \Automattic\Jetpack\Connection\Connection_Health_Test_Base
 * @covers \Automattic\Jetpack\Connection\Connection_Health_Tests
 */
#[CoversClass( Connection_Health_Test_Base::class )]
#[CoversClass( Connection_Health_Tests::class )]
class Connection_Health_Test_Base_Test extends TestCase {

	/**
	 * Test instance.
	 *
	 * @var Connection_Health_Test_Base
	 */
	private $base;

	/**
	 * Set up test fixtures.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->base = new Connection_Health_Test_Base();
	}

	/**
	 * Test adding a test successfully.
	 */
	public function test_add_test_success() {
		$result = $this->base->add_test(
			function () {
				return array( 'pass' => true );
			},
			'test_example',
			'direct'
		);
		$this->assertTrue( $result );
	}

	/**
	 * Test adding a test with duplicate name fails.
	 */
	public function test_add_test_duplicate_name() {
		$callable = function () {
			return array( 'pass' => true );
		};
		$this->base->add_test( $callable, 'test_dup' );
		$result = $this->base->add_test( $callable, 'test_dup' );
		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	/**
	 * Test adding a test with pre-7.3.0 arguments (array as name) fails.
	 */
	public function test_add_test_legacy_arguments() {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Intentionally passing wrong type to test pre-7.3.0 compat guard.
		$result = $this->base->add_test( function () {}, array( 'default' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_arguments', $result->get_error_code() );
	}

	/**
	 * Test adding a test with invalid callable fails.
	 */
	public function test_add_test_invalid_callable() {
		// @phan-suppress-next-line PhanUndeclaredFunctionInCallable -- Intentionally invalid callable for testing.
		$result = $this->base->add_test( 'not_a_callable_function_xyz', 'test_invalid' );
		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	/**
	 * Test list_tests returns all tests by default.
	 */
	public function test_list_tests_all() {
		$this->base->add_test( function () {}, 'test_a', 'direct' );
		$this->base->add_test( function () {}, 'test_b', 'async' );

		$tests = $this->base->list_tests();
		$this->assertCount( 2, $tests );
		$this->assertArrayHasKey( 'test_a', $tests );
		$this->assertArrayHasKey( 'test_b', $tests );
	}

	/**
	 * Test list_tests filters by type.
	 */
	public function test_list_tests_by_type() {
		$this->base->add_test( function () {}, 'test_direct', 'direct' );
		$this->base->add_test( function () {}, 'test_async', 'async' );

		$direct = $this->base->list_tests( 'direct' );
		$this->assertCount( 1, $direct );
		$this->assertArrayHasKey( 'test_direct', $direct );

		$async = $this->base->list_tests( 'async' );
		$this->assertCount( 1, $async );
		$this->assertArrayHasKey( 'test_async', $async );
	}

	/**
	 * Test run_test executes a registered test.
	 */
	public function test_run_test_success() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'test_run' ) );
			},
			'test_run'
		);

		$result = $this->base->run_test( 'test_run' );
		$this->assertTrue( $result['pass'] );
	}

	/**
	 * Test run_test returns WP_Error for unknown test.
	 */
	public function test_run_test_unknown() {
		$result = $this->base->run_test( 'nonexistent' );
		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	/**
	 * Test pass() returns true when all tests pass.
	 */
	public function test_pass_all_passing() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'test_pass1' ) );
			},
			'test_pass1'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'test_pass2' ) );
			},
			'test_pass2'
		);

		$this->assertTrue( $this->base->pass() );
	}

	/**
	 * Test pass() returns false when a test fails.
	 */
	public function test_pass_with_failure() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'test_ok' ) );
			},
			'test_ok'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test( array( 'name' => 'test_fail' ) );
			},
			'test_fail'
		);

		$this->assertFalse( $this->base->pass() );
	}

	/**
	 * Test pass() returns true when tests are skipped (not failed).
	 */
	public function test_pass_with_skipped() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::skipped_test( array( 'name' => 'test_skip' ) );
			},
			'test_skip'
		);

		$this->assertTrue( $this->base->pass() );
	}

	/**
	 * Test list_fails returns only failed tests.
	 */
	public function test_list_fails() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'test_ok' ) );
			},
			'test_ok'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test(
					array(
						'name'              => 'test_fail',
						'short_description' => 'This test failed.',
					)
				);
			},
			'test_fail'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::skipped_test( array( 'name' => 'test_skip' ) );
			},
			'test_skip'
		);

		$fails = $this->base->list_fails();
		$this->assertCount( 1, $fails );
	}

	/**
	 * Test passing_test helper returns correct structure.
	 */
	public function test_passing_test_structure() {
		$result = Connection_Health_Test_Base::passing_test( array( 'name' => 'my_test' ) );

		$this->assertTrue( $result['pass'] );
		$this->assertEquals( 'my_test', $result['name'] );
		$this->assertTrue( $result['show_in_site_health'] );
	}

	/**
	 * Test failing_test helper returns correct structure.
	 */
	public function test_failing_test_structure() {
		$result = Connection_Health_Test_Base::failing_test(
			array(
				'name'              => 'my_test',
				'short_description' => 'Something broke',
			)
		);

		$this->assertFalse( $result['pass'] );
		$this->assertEquals( 'critical', $result['severity'] );
		$this->assertEquals( 'Something broke', $result['short_description'] );
	}

	/**
	 * Test skipped_test helper returns correct structure.
	 */
	public function test_skipped_test_structure() {
		$result = Connection_Health_Test_Base::skipped_test( array( 'name' => 'my_test' ) );

		$this->assertEquals( 'skipped', $result['pass'] );
	}

	/**
	 * Test informational_test helper returns correct structure.
	 */
	public function test_informational_test_structure() {
		$result = Connection_Health_Test_Base::informational_test( array( 'name' => 'my_test' ) );

		$this->assertEquals( 'informational', $result['pass'] );
	}

	/**
	 * Test output_fails_as_wp_error returns false when all pass.
	 */
	public function test_output_fails_as_wp_error_when_passing() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'ok' ) );
			},
			'ok'
		);

		$this->assertFalse( $this->base->output_fails_as_wp_error() );
	}

	/**
	 * Test output_fails_as_wp_error returns WP_Error when tests fail.
	 */
	public function test_output_fails_as_wp_error_when_failing() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test(
					array(
						'name'              => 'fail_test',
						'short_description' => 'Broken',
					)
				);
			},
			'fail_test'
		);

		$error = $this->base->output_fails_as_wp_error();
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertEquals( 'failed_fail_test', $error->get_error_code() );
	}

	/**
	 * Test that a subclass extending Connection_Health_Test_Base can use helper
	 * methods and register its tests on an external Connection_Health_Tests instance
	 * via the jetpack_connection_tests_loaded action.
	 *
	 * This simulates the pattern used by the Jetpack plugin's Jetpack_Cxn_Tests class.
	 */
	public function test_external_subclass_can_register_tests_via_action() {
		// Create a subclass that uses helper methods from the base class.
		$external = new class() extends Connection_Health_Test_Base {
			/**
			 * Constructor — auto-discovers test methods.
			 */
			public function __construct() {
				parent::__construct();
				$methods = get_class_methods( self::class );
				foreach ( $methods as $method ) {
					if ( ! str_contains( $method, 'test__' ) ) {
						continue;
					}
					$this->add_test( array( $this, $method ), $method, 'direct' );
				}
			}

			/**
			 * A test that uses helper methods from the base class.
			 *
			 * @return array
			 */
			protected function test__plugin_specific() {
				// Exercise helper methods to verify they're accessible.
				$this->helper_is_connected();
				$this->helper_get_support_text();
				$this->helper_get_support_url();
				return self::passing_test( array( 'name' => 'test__plugin_specific' ) );
			}
		};

		// Verify the subclass discovered its test.
		$tests = $external->list_tests();
		$this->assertArrayHasKey( 'test__plugin_specific', $tests );

		// Simulate registering on a Connection_Health_Tests instance (as done via action hook).
		$connection_tests = new Connection_Health_Tests();
		$initial_count    = count( $connection_tests->list_tests() );

		foreach ( $external->list_tests() as $test ) {
			$connection_tests->add_test( $test['test'], $test['name'], $test['type'] );
		}

		$this->assertCount( $initial_count + 1, $connection_tests->list_tests() );
		$this->assertArrayHasKey( 'test__plugin_specific', $connection_tests->list_tests() );

		// Verify the test can actually be run from the connection tests instance.
		$result = $connection_tests->run_test( 'test__plugin_specific' );
		$this->assertTrue( $result['pass'] );
	}
}
