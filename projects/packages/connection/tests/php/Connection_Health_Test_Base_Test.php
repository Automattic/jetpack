<?php
/**
 * Tests for the Connection_Health_Test_Base class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status\Cache as StatusCache;
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
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();
		StatusCache::clear();
		remove_all_filters( 'jetpack_connection_reconnect_url' );
		remove_all_filters( 'jetpack_connection_support_url' );
		remove_all_filters( 'jetpack_connection_site_health_badge_label' );
		remove_all_filters( 'jetpack_offline_mode' );
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
	 * Test list_tests filters by group.
	 */
	public function test_list_tests_by_group() {
		$this->base->add_test( function () {}, 'test_default', 'direct' );
		$this->base->add_test( function () {}, 'test_custom', 'direct', array( 'custom' ) );

		$default = $this->base->list_tests( 'all', 'default' );
		$this->assertCount( 1, $default );
		$this->assertArrayHasKey( 'test_default', $default );

		$custom = $this->base->list_tests( 'all', 'custom' );
		$this->assertCount( 1, $custom );
		$this->assertArrayHasKey( 'test_custom', $custom );

		$all = $this->base->list_tests( 'all', 'all' );
		$this->assertCount( 2, $all );
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
	 * Test run_tests populates results and sets the pass flag.
	 */
	public function test_run_tests_populates_results() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'test_a' ) );
			},
			'test_a',
			'direct'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::skipped_test( array( 'name' => 'test_b' ) );
			},
			'test_b',
			'async'
		);

		$results = $this->base->raw_results();
		$this->assertCount( 2, $results );
		$this->assertTrue( $this->base->pass() );
	}

	/**
	 * Test run_tests sets pass to false when a test fails.
	 */
	public function test_run_tests_sets_pass_false_on_failure() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'ok' ) );
			},
			'ok'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test( array( 'name' => 'bad' ) );
			},
			'bad'
		);

		$this->assertFalse( $this->base->pass() );
	}

	/**
	 * Test raw_results filters by type.
	 */
	public function test_raw_results_filters_by_type() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'direct_test' ) );
			},
			'direct_test',
			'direct'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'async_test' ) );
			},
			'async_test',
			'async'
		);

		$direct_results = $this->base->raw_results( 'direct' );
		$this->assertCount( 1, $direct_results );

		$async_results = $this->base->raw_results( 'async' );
		$this->assertCount( 1, $async_results );
	}

	/**
	 * Test list_fails filters by type.
	 */
	public function test_list_fails_filters_by_type() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test(
					array(
						'name'              => 'direct_fail',
						'short_description' => 'Failed',
					)
				);
			},
			'direct_fail',
			'direct'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test(
					array(
						'name'              => 'async_fail',
						'short_description' => 'Failed',
					)
				);
			},
			'async_fail',
			'async'
		);

		$direct_fails = $this->base->list_fails( 'direct' );
		$this->assertCount( 1, $direct_fails );

		$async_fails = $this->base->list_fails( 'async' );
		$this->assertCount( 1, $async_fails );
	}

	/**
	 * Test connection_failing_test returns correct structure with defaults.
	 */
	public function test_connection_failing_test_structure() {
		$result = Connection_Health_Test_Base::connection_failing_test( 'test_cxn_fail' );

		$this->assertFalse( $result['pass'] );
		$this->assertEquals( 'test_cxn_fail', $result['name'] );
		$this->assertEquals( 'critical', $result['severity'] );
		$this->assertNotEmpty( $result['short_description'] );
		$this->assertFalse( $result['action'] );
		$this->assertFalse( $result['action_label'] );
		$this->assertNotEmpty( $result['long_description'] );
	}

	/**
	 * Test connection_failing_test with custom error and recommendation.
	 */
	public function test_connection_failing_test_with_custom_args() {
		$result = Connection_Health_Test_Base::connection_failing_test(
			'test_custom',
			'Custom error message',
			'Try this fix'
		);

		$this->assertFalse( $result['pass'] );
		$this->assertEquals( 'Custom error message', $result['short_description'] );
		$this->assertStringContainsString( 'Custom error message', $result['long_description'] );
		$this->assertStringContainsString( 'Try this fix', $result['long_description'] );
	}

	/**
	 * Test connection_failing_test uses the reconnect URL filter.
	 */
	public function test_connection_failing_test_reconnect_url_filter() {
		add_filter(
			'jetpack_connection_reconnect_url',
			function () {
				return 'https://example.com/custom-reconnect';
			}
		);

		$result = Connection_Health_Test_Base::connection_failing_test( 'test_filter' );
		$this->assertEquals( 'https://example.com/custom-reconnect', $result['action'] );
	}

	/**
	 * Test increase_timeout returns 30.
	 */
	public function test_increase_timeout() {
		$this->assertEquals( 30, Connection_Health_Test_Base::increase_timeout() );
	}

	/**
	 * Test offline_mode_trigger_text when not in offline mode.
	 */
	public function test_offline_mode_trigger_text_when_not_offline() {
		$text = Connection_Health_Test_Base::offline_mode_trigger_text();
		$this->assertStringContainsString( 'not in Offline Mode', $text );
	}

	/**
	 * Test offline_mode_trigger_text when in offline mode via filter.
	 */
	public function test_offline_mode_trigger_text_when_offline_via_filter() {
		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$text = Connection_Health_Test_Base::offline_mode_trigger_text();
		$this->assertStringContainsString( 'jetpack_offline_mode', $text );
	}

	/**
	 * Test get_site_health_badge_label returns default.
	 */
	public function test_get_site_health_badge_label_default() {
		$this->assertEquals( 'Jetpack Connection', $this->base->get_site_health_badge_label() );
	}

	/**
	 * Test get_site_health_badge_label can be filtered.
	 */
	public function test_get_site_health_badge_label_filtered() {
		add_filter(
			'jetpack_connection_site_health_badge_label',
			function () {
				return 'Custom Plugin';
			}
		);

		$this->assertEquals( 'Custom Plugin', $this->base->get_site_health_badge_label() );
	}

	/**
	 * Test output_results_for_core_async_site_health when all tests pass.
	 */
	public function test_output_results_for_core_async_site_health_passing() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'test_ok' ) );
			},
			'test_ok'
		);

		$result = $this->base->output_results_for_core_async_site_health();

		$this->assertIsArray( $result );
		$this->assertEquals( 'good', $result['status'] );
		$this->assertArrayHasKey( 'label', $result );
		$this->assertArrayHasKey( 'badge', $result );
		$this->assertArrayHasKey( 'description', $result );
		$this->assertEquals( 'jetpack_connection_local_testing_suite', $result['test'] );
	}

	/**
	 * Test output_results_for_core_async_site_health with a failing async test.
	 */
	public function test_output_results_for_core_async_site_health_failing() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test(
					array(
						'name'              => 'async_fail',
						'short_description' => 'Something broke',
						'long_description'  => 'Detailed explanation',
						'action'            => 'https://example.com/fix',
						'action_label'      => 'Fix it',
					)
				);
			},
			'async_fail',
			'async'
		);

		$result = $this->base->output_results_for_core_async_site_health();

		$this->assertEquals( 'Something broke', $result['label'] );
		$this->assertEquals( 'critical', $result['status'] );
		$this->assertStringContainsString( 'Detailed explanation', $result['description'] );
		$this->assertStringContainsString( 'https://example.com/fix', $result['actions'] );
		$this->assertStringContainsString( 'Fix it', $result['actions'] );
	}

	/**
	 * Test encrypt_string_for_wpcom returns encrypted data.
	 */
	public function test_encrypt_string_for_wpcom() {
		if ( ! function_exists( 'openssl_get_publickey' ) ) {
			$this->markTestSkipped( 'openssl extension not available.' );
		}

		$result = $this->base->encrypt_string_for_wpcom( 'test data' );
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'data', $result );
		$this->assertArrayHasKey( 'key', $result );
		$this->assertArrayHasKey( 'iv', $result );
		$this->assertArrayHasKey( 'cipher', $result );
	}

	/**
	 * Test output_fails_as_wp_error aggregates multiple failures.
	 */
	public function test_output_fails_as_wp_error_multiple_failures() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test(
					array(
						'name'              => 'fail_one',
						'short_description' => 'First failure',
					)
				);
			},
			'fail_one'
		);
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test(
					array(
						'name'              => 'fail_two',
						'short_description' => 'Second failure',
					)
				);
			},
			'fail_two'
		);

		$error = $this->base->output_fails_as_wp_error();
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertEquals( 'failed_fail_one', $error->get_error_code() );
		$codes = $error->get_error_codes();
		$this->assertContains( 'failed_fail_one', $codes );
		$this->assertContains( 'failed_fail_two', $codes );
	}

	/**
	 * Test output_fails_as_wp_error passes type and group to pass().
	 */
	public function test_output_fails_as_wp_error_respects_type_filter() {
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::failing_test(
					array(
						'name'              => 'async_fail',
						'short_description' => 'Async failure',
					)
				);
			},
			'async_fail',
			'async'
		);

		// Filtering by 'direct' should not see the async failure.
		$this->assertFalse( $this->base->output_fails_as_wp_error( 'direct' ) );

		// Filtering by 'async' should see it.
		$error = $this->base->output_fails_as_wp_error( 'async' );
		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertEquals( 'failed_async_fail', $error->get_error_code() );
	}

	/**
	 * Test output_results_for_cli returns early when not in WP_CLI context.
	 */
	public function test_output_results_for_cli_returns_early_outside_cli() {
		// Should not error or produce output when WP_CLI is not defined.
		$this->base->add_test(
			function () {
				return Connection_Health_Test_Base::passing_test( array( 'name' => 'test_cli' ) );
			},
			'test_cli'
		);

		$this->base->output_results_for_cli();

		// If we reach here without error, the guard works.
		$this->assertTrue( true );
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
