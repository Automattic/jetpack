<?php
/**
 * Tests functionality in the atomic.php file.
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;

require_once JETPACK__PLUGIN_DIR . '3rd-party/atomic.php';

/**
 * Class Atomic_Override_Support_Test
 */
class Atomic_Override_Support_Test extends WP_UnitTestCase {
	/**
	 * Clean up tests.
	 */
	public function tear_down() {
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Helper to setup the Atomic constants as needed.
	 */
	public function helper__set_atomic_constants() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );
		Constants::set_constant( 'ATOMIC_SITE_ID', 999 );
		Constants::set_constant( 'JETPACK__VERSION', '10.3-a.1' );
	}

	/**
	 * Test that Development Versions are suppressed on Atomic.
	 */
	public function test_atomic_returns_false_on_dev_version() {
		$this->helper__set_atomic_constants();
		$this->assertFalse( Jetpack::is_development_version() );
	}

	/**
	 * Test that Development Versions via the Beta plugin are still considered as Development versions.
	 */
	public function test_atomic_returns_expected_if_not_on_atomic() {
		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			$this->markTestSkipped( 'should not be tested in Atomic environment.' );
		}
		Constants::set_constant( 'JETPACK__VERSION', '10.3-a.1' );
		$this->assertTrue( Jetpack::is_development_version() );

		Constants::set_constant( 'JETPACK__VERSION', '10.3.0' );
		$this->assertFalse( Jetpack::is_development_version() );
	}

	/**
	 * Test that the WAF is not available on Atomic.
	 */
	public function test_atomic_no_waf() {
			$this->helper__set_atomic_constants();
			$this->assertNotContains( 'waf', ( new Modules() )->get_available() );
	}
}
