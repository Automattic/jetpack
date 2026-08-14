<?php
/**
 * Tests for the Site_Health class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Site_Health class.
 *
 * @covers \Automattic\Jetpack\Connection\Site_Health
 */
#[CoversClass( Site_Health::class )]
class Site_Health_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		// Reset the static initialized flag via reflection.
		$reflection = new \ReflectionClass( Site_Health::class );
		$property   = $reflection->getProperty( 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );

		remove_all_filters( 'site_status_tests' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_debugger_run_self_test' );
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'jetpack_connection_tests_loaded' );
		remove_all_actions( 'wp_ajax_health-check-jetpack-connection-health' );
	}

	/**
	 * Register the connection tests and return the direct test callbacks.
	 *
	 * @return array Map of test name => Site Health callback.
	 */
	private function register_direct_tests() {
		$result = Site_Health::register_site_health_tests(
			array(
				'direct' => array(),
				'async'  => array(),
			)
		);

		return $result['direct'];
	}

	/**
	 * Register an extra test through the action other plugins use, so the suite
	 * contains a test that cannot appear in the default label map.
	 *
	 * @param string $name   Test name.
	 * @param array  $result Result the test should return.
	 */
	private function register_third_party_test( $name, array $result ) {
		add_action(
			'jetpack_connection_tests_loaded',
			function ( $tests ) use ( $name, $result ) {
				$tests->add_test(
					function () use ( $result ) {
						return $result;
					},
					$name
				);
			}
		);
	}

	/**
	 * Test init() only registers once.
	 */
	public function test_init_only_once() {
		Site_Health::init();
		$count_first = has_action( 'admin_init', array( Site_Health::class, 'maybe_register_site_health' ) );

		Site_Health::init();
		$count_second = has_action( 'admin_init', array( Site_Health::class, 'maybe_register_site_health' ) );

		$this->assertEquals( $count_first, $count_second );
	}

	/**
	 * Test that maybe_register_site_health defers when the legacy Jetpack debugger
	 * filter is present (simulating an old Jetpack plugin).
	 */
	public function test_maybe_register_defers_to_legacy_jetpack() {
		// Simulate old Jetpack having registered its Site Health filter.
		// @phan-suppress-next-line PhanUndeclaredFunctionInCallable -- Intentionally referencing a function defined by old Jetpack, not this package.
		add_filter( 'site_status_tests', 'jetpack_debugger_site_status_tests' );

		Site_Health::maybe_register_site_health();

		// Our filter should NOT have been added.
		$this->assertFalse(
			has_filter( 'site_status_tests', array( Site_Health::class, 'register_site_health_tests' ) )
		);
	}

	/**
	 * Test that maybe_register_site_health registers when no legacy debugger is present.
	 */
	public function test_maybe_register_when_no_legacy() {
		Site_Health::maybe_register_site_health();

		$this->assertNotFalse(
			has_filter( 'site_status_tests', array( Site_Health::class, 'register_site_health_tests' ) )
		);
	}

	/**
	 * Test register_site_health_tests adds tests to the core tests array.
	 */
	public function test_register_site_health_tests_adds_tests() {
		$core_tests = array(
			'direct' => array(),
			'async'  => array(),
		);

		$result = Site_Health::register_site_health_tests( $core_tests );

		// Should have added direct tests (at least some connection tests).
		$this->assertNotEmpty( $result['direct'] );

		// Should have added the async test.
		$this->assertArrayHasKey( 'jetpack_connection_test_suite', $result['async'] );
		$this->assertEquals( 'jetpack-connection-health', $result['async']['jetpack_connection_test_suite']['test'] );
	}

	/**
	 * Test that direct test entries have the expected structure.
	 */
	public function test_direct_test_entry_structure() {
		$core_tests = array(
			'direct' => array(),
			'async'  => array(),
		);

		$result = Site_Health::register_site_health_tests( $core_tests );

		// Pick the first direct test.
		$first_test = reset( $result['direct'] );

		$this->assertArrayHasKey( 'label', $first_test );
		$this->assertArrayHasKey( 'test', $first_test );
		$this->assertIsCallable( $first_test['test'] );
	}

	/**
	 * Test that maybe_register_site_health registers the AJAX action.
	 */
	public function test_maybe_register_adds_ajax_action() {
		Site_Health::maybe_register_site_health();

		$this->assertNotFalse(
			has_action( 'wp_ajax_health-check-jetpack-connection-health', array( Site_Health::class, 'ajax_local_testing_suite' ) )
		);
	}

	/**
	 * Test that invoking a direct test callback returns valid Site Health structure for a passing test.
	 */
	public function test_direct_callback_returns_site_health_format_for_passing_test() {
		$core_tests = array(
			'direct' => array(),
			'async'  => array(),
		);

		$result = Site_Health::register_site_health_tests( $core_tests );

		// xml_parser_available always passes in CI.
		$this->assertArrayHasKey( 'test__xml_parser_available', $result['direct'] );
		$callback = $result['direct']['test__xml_parser_available']['test'];

		$output = $callback();

		$this->assertIsArray( $output );
		$this->assertArrayHasKey( 'label', $output );
		$this->assertArrayHasKey( 'status', $output );
		$this->assertArrayHasKey( 'badge', $output );
		$this->assertArrayHasKey( 'description', $output );
		$this->assertArrayHasKey( 'actions', $output );
		$this->assertArrayHasKey( 'test', $output );
		$this->assertEquals( 'good', $output['status'] );
		$this->assertEquals( 'jetpack_test__xml_parser_available', $output['test'] );
	}

	/**
	 * Test that invoking a direct test callback returns correct structure for a failing test.
	 */
	public function test_direct_callback_returns_site_health_format_for_failing_test() {
		// Mock HTTP to fail for outbound_http.
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array( 'code' => 500 ),
					'body'     => 'Error',
				);
			}
		);

		$core_tests = array(
			'direct' => array(),
			'async'  => array(),
		);

		$result = Site_Health::register_site_health_tests( $core_tests );

		$this->assertArrayHasKey( 'test__outbound_http', $result['direct'] );
		$callback = $result['direct']['test__outbound_http']['test'];

		$output = $callback();

		$this->assertIsArray( $output );
		$this->assertNotEquals( 'good', $output['status'] );
		$this->assertEquals( 'jetpack_test__outbound_http', $output['test'] );
	}

	/**
	 * Test that invoking a direct test callback returns correct structure for a skipped test.
	 */
	public function test_direct_callback_returns_site_health_format_for_skipped_test() {
		$core_tests = array(
			'direct' => array(),
			'async'  => array(),
		);

		$result = Site_Health::register_site_health_tests( $core_tests );

		// blog_token_if_exists skips when not connected.
		$this->assertArrayHasKey( 'test__blog_token_if_exists', $result['direct'] );
		$callback = $result['direct']['test__blog_token_if_exists']['test'];

		$output = $callback();

		$this->assertIsArray( $output );
		// Skipped tests still return 'good' status (they aren't failures).
		$this->assertEquals( 'good', $output['status'] );
	}

	/**
	 * Test that a result carrying no label of its own gets the readable heading from
	 * the default map, rather than one derived from the method name.
	 *
	 * This is the case that prompted the map: the skipped result sets no label, and
	 * the heading used to read "Wpcom Connection Test".
	 */
	public function test_direct_callback_applies_default_label() {
		$tests = $this->register_direct_tests();

		// Skips when not connected, and the skipped result sets no label.
		$output = $tests['test__wpcom_connection_test']['test']();

		$this->assertSame( 'Requests from WordPress.com', $output['label'] );
	}

	/**
	 * Test that the default map is applied to every test, not just the one it was
	 * introduced for.
	 */
	public function test_direct_callback_applies_default_label_to_other_tests() {
		$tests = $this->register_direct_tests();

		$output = $tests['test__blog_token_if_exists']['test']();

		$this->assertSame( 'Site token', $output['label'] );
	}

	/**
	 * Test that a result which sets its own label keeps it, so the default never
	 * overwrites a more specific heading.
	 */
	public function test_direct_callback_keeps_label_set_by_the_result() {
		$this->register_third_party_test(
			'test__labelled_example',
			Connection_Health_Tests::failing_test(
				array(
					'name'  => 'test__labelled_example',
					'label' => 'A more specific heading',
				)
			)
		);

		$tests = $this->register_direct_tests();

		$output = $tests['test__labelled_example']['test']();

		$this->assertSame( 'A more specific heading', $output['label'] );
	}

	/**
	 * Test that a test registered by another plugin, which cannot appear in the
	 * default map, still falls back to a heading derived from its name.
	 */
	public function test_direct_callback_derives_label_for_third_party_test() {
		$this->register_third_party_test(
			'test__some_other_plugin_check',
			Connection_Health_Tests::passing_test( array( 'name' => 'test__some_other_plugin_check' ) )
		);

		$tests = $this->register_direct_tests();

		$output = $tests['test__some_other_plugin_check']['test']();

		$this->assertSame( 'Some Other Plugin Check', $output['label'] );
	}

	/**
	 * Test that the default label map covers every built-in test, in both directions.
	 *
	 * Without this, renaming a test method degrades its heading back to the derived
	 * form silently, and removing one leaves a dead entry behind.
	 */
	public function test_default_label_map_matches_the_built_in_tests() {
		// Registers test__wpcom_self_test, which is otherwise left out of the suite.
		add_filter( 'jetpack_debugger_run_self_test', '__return_true' );

		$method = new \ReflectionMethod( Site_Health::class, 'get_default_test_labels' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$labels = $method->invoke( null );

		$registered = array_keys( ( new Connection_Health_Tests() )->list_tests( 'direct' ) );

		sort( $registered );
		$mapped = array_keys( $labels );
		sort( $mapped );

		$this->assertSame(
			$registered,
			$mapped,
			'Site_Health::get_default_test_labels() must list exactly the built-in connection tests.'
		);
	}
}
