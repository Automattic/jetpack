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
		$property->setAccessible( true );
		$property->setValue( null, false );

		remove_all_filters( 'site_status_tests' );
		remove_all_actions( 'admin_init' );
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
}
